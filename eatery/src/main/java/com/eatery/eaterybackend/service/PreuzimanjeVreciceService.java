package com.eatery.eaterybackend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatery.eaterybackend.entity.KlijentEntity;
import com.eatery.eaterybackend.entity.NarudzbaEntity;
import com.eatery.eaterybackend.entity.VrecicaIznenadjenjaEntity;
import com.eatery.eaterybackend.repository.KlijentRepository;
import com.eatery.eaterybackend.repository.NarudzbaRepository;

/*
  Vremenski prozor za preuzimanje vrećica iznenađenja.
  Restoran na vrećici definiše satnicu (npr. 18:00 – 19:30). Kada kupac naruči vrećicu,
  na narudžbu se upisuje konkretan termin (datum + satnica). Kada termin počne,
  kupac dobija WebSocket obavještenje na /topic/kupac/{id} da može doći po vrećicu.
 */
@Service
public class PreuzimanjeVreciceService {

    private static final ZoneId ZONA = ZoneId.of("Europe/Sarajevo");
    private static final Pattern SATI = Pattern.compile("^(\\d{1,2}):(\\d{2})(:\\d{2})?$");
    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");
    private static final Set<String> ZAVRSNI_STATUSI =
            Set.of("PREUZETO", "DOSTAVLJENO", "OTKAZANA", "OTKAZANO", "ODBIJENA");

    private final NarudzbaRepository narudzbaRepository;
    private final KlijentRepository klijentRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public PreuzimanjeVreciceService(NarudzbaRepository narudzbaRepository,
                                     KlijentRepository klijentRepository,
                                     SimpMessagingTemplate messagingTemplate) {
        this.narudzbaRepository = narudzbaRepository;
        this.klijentRepository = klijentRepository;
        this.messagingTemplate = messagingTemplate;
    }

    /* Konkretan termin preuzimanja (od – do) za jednu narudžbu. */
    public record Termin(LocalDateTime od, LocalDateTime doVrijeme) {
        public boolean jeAktivan(LocalDateTime sada) {
            return !sada.isBefore(od) && sada.isBefore(doVrijeme);
        }
    }

    /* Rezultat izračuna termina: ili termin (može biti null ako vrećice nemaju satnicu) ili poruka greške. */
    public record RezultatTermina(Termin termin, String greska) {
        static RezultatTermina ok(Termin termin) { return new RezultatTermina(termin, null); }
        static RezultatTermina greska(String poruka) { return new RezultatTermina(null, poruka); }
    }

    public LocalDateTime sada() {
        return LocalDateTime.now(ZONA);
    }

    /* Vraća poruku greške ili null ako je satnica ispravna. */
    public String validirajSatnicu(String od, String doVrijeme) {
        LocalTime pocetak = parsuj(od);
        LocalTime kraj = parsuj(doVrijeme);
        if (pocetak == null || kraj == null) {
            return "Unesite ispravno vrijeme preuzimanja (od – do), npr. 18:00 – 19:30.";
        }
        if (pocetak.equals(kraj)) {
            return "Vrijeme početka i kraja preuzimanja ne može biti isto.";
        }
        return null;
    }

    /* Normalizuje unos u format HH:mm (npr. "8:00" -> "08:00"). */
    public String normalizuj(String vrijeme) {
        LocalTime t = parsuj(vrijeme);
        return t != null ? t.format(HH_MM) : null;
    }

    /*
      Računa termin preuzimanja za vrećice u narudžbi.
      Ako je više vrećica, termin je presjek njihovih satnica (vrijeme kada su sve dostupne).
     */
    public RezultatTermina izracunajTermin(List<VrecicaIznenadjenjaEntity> vrecice, LocalDateTime sada) {
        Termin presjek = null;

        for (VrecicaIznenadjenjaEntity v : vrecice) {
            Termin t = terminZaDanas(v.getVrijemePreuzimanjaOd(), v.getVrijemePreuzimanjaDo(), sada);
            if (t == null) {
                continue; // stara vrećica bez satnice
            }
            if (!sada.isBefore(t.doVrijeme())) {
                return RezultatTermina.greska("Vrijeme preuzimanja za vrećicu \"" + v.getNaziv() + "\" ("
                        + formatiraj(t) + ") je za danas isteklo.");
            }
            if (presjek == null) {
                presjek = t;
            } else {
                LocalDateTime od = t.od().isAfter(presjek.od()) ? t.od() : presjek.od();
                LocalDateTime doV = t.doVrijeme().isBefore(presjek.doVrijeme()) ? t.doVrijeme() : presjek.doVrijeme();
                if (!od.isBefore(doV)) {
                    return RezultatTermina.greska("Vrećice u korpi imaju termine preuzimanja koji se ne preklapaju. "
                            + "Naručite ih odvojeno.");
                }
                presjek = new Termin(od, doV);
            }
        }
        return RezultatTermina.ok(presjek);
    }

    /* Pretvara dnevnu satnicu (npr. 18:00 – 19:30) u konkretan termin za danas. Podržava i termin preko ponoći. */
    Termin terminZaDanas(String od, String doVrijeme, LocalDateTime sada) {
        LocalTime pocetak = parsuj(od);
        LocalTime kraj = parsuj(doVrijeme);
        if (pocetak == null || kraj == null || pocetak.equals(kraj)) {
            return null;
        }
        LocalDate danas = sada.toLocalDate();

        if (pocetak.isBefore(kraj)) {
            return new Termin(danas.atTime(pocetak), danas.atTime(kraj));
        }
        // Termin preko ponoći, npr. 22:00 – 01:00
        if (sada.toLocalTime().isBefore(kraj)) {
            return new Termin(danas.minusDays(1).atTime(pocetak), danas.atTime(kraj));
        }
        return new Termin(danas.atTime(pocetak), danas.plusDays(1).atTime(kraj));
    }

    public String formatiraj(Termin t) {
        return t.od().format(HH_MM) + " – " + t.doVrijeme().format(HH_MM);
    }

    /* Svake minute (u :00 sekundi) šalje obavještenje kupcima čiji je termin preuzimanja upravo počeo. */
    @Scheduled(cron = "0 * * * * *", zone = "Europe/Sarajevo")
    @Transactional
    public void posaljiObavijestiZaPreuzimanje() {
        LocalDateTime sada = sada();
        List<NarudzbaEntity> narudzbe = narudzbaRepository.findZaObavijestPreuzimanja(sada);

        for (NarudzbaEntity n : narudzbe) {
            String status = n.getStatus() != null ? n.getStatus().toUpperCase() : "";
            if (!ZAVRSNI_STATUSI.contains(status)) {
                posaljiObavijest(n);
            }
            n.setObavijestPreuzimanjaPoslana(true);
            narudzbaRepository.save(n);
        }
    }

    private void posaljiObavijest(NarudzbaEntity n) {
        if (n.getKupac() == null) {
            return;
        }
        Termin termin = new Termin(n.getPreuzimanjeOd(), n.getPreuzimanjeDo());

        Map<String, Object> poruka = new HashMap<>();
        poruka.put("tip", "VRECICA_SPREMNA");
        poruka.put("narudzbaId", n.getId());
        poruka.put("sifra", n.getSifra());
        poruka.put("restoranNaziv", nazivRestorana(n));
        poruka.put("preuzimanjeOd", termin.od().format(HH_MM));
        poruka.put("preuzimanjeDo", termin.doVrijeme().format(HH_MM));
        poruka.put("pin", n.getPin());

        messagingTemplate.convertAndSend("/topic/kupac/" + n.getKupac().getId(), (Object) poruka);
    }

    private String nazivRestorana(NarudzbaEntity n) {
        if (n.getRestoran() == null) {
            return "restoran";
        }
        return klijentRepository.findById(n.getRestoran().getId())
                .map(KlijentEntity::getNazivObjekta)
                .filter(naziv -> naziv != null && !naziv.isBlank())
                .orElse(n.getRestoran().getKorisnickoIme());
    }

    private static LocalTime parsuj(String vrijeme) {
        if (vrijeme == null || vrijeme.isBlank()) {
            return null;
        }
        Matcher m = SATI.matcher(vrijeme.trim());
        if (!m.matches()) {
            return null;
        }
        int h = Integer.parseInt(m.group(1));
        int min = Integer.parseInt(m.group(2));
        if (h > 23 || min > 59) {
            return null;
        }
        return LocalTime.of(h, min);
    }
}
