package com.eatery.eaterybackend.controller;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.eatery.eaterybackend.dto.NarudzbaDTO;
import com.eatery.eaterybackend.entity.KlijentEntity;
import com.eatery.eaterybackend.entity.KorisnikEntity;
import com.eatery.eaterybackend.entity.NarudzbaEntity;
import com.eatery.eaterybackend.entity.StavkaNarudzbeEntity;
import com.eatery.eaterybackend.entity.VrecicaIznenadjenjaEntity;
import com.eatery.eaterybackend.repository.KlijentRepository;
import com.eatery.eaterybackend.repository.KorisnikRepository;
import com.eatery.eaterybackend.repository.NarudzbaRepository;
import com.eatery.eaterybackend.repository.StavkaNarudzbeRepository;
import com.eatery.eaterybackend.repository.VrecicaIznenadjenjaRepository;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api/narudzbe")
public class NarudzbaController {

    private final NarudzbaRepository narudzbaRepository;
    private final KorisnikRepository korisnikRepository;
    private final StavkaNarudzbeRepository stavkaNarudzbeRepository;
    private final VrecicaIznenadjenjaRepository vrecicaIznenadjenjaRepository;
    private final KlijentRepository klijentRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NarudzbaController(NarudzbaRepository narudzbaRepository,
                              KorisnikRepository korisnikRepository,
                              StavkaNarudzbeRepository stavkaNarudzbeRepository,
                              VrecicaIznenadjenjaRepository vrecicaIznenadjenjaRepository,
                              KlijentRepository klijentRepository,
                              SimpMessagingTemplate messagingTemplate) {
                                
        this.narudzbaRepository = narudzbaRepository;
        this.korisnikRepository = korisnikRepository;
        this.stavkaNarudzbeRepository = stavkaNarudzbeRepository;
        this.vrecicaIznenadjenjaRepository = vrecicaIznenadjenjaRepository;
        this.klijentRepository = klijentRepository;
        this.messagingTemplate = messagingTemplate;
    }

    private boolean jeRestoranOtvoren(String od, String doVrijeme) {

        if (od == null || doVrijeme == null || od.isBlank() || doVrijeme.isBlank()) {

            return true;
        }
        try {

            LocalTime from = LocalTime.parse(normalizujVrijeme(od));
            LocalTime to = LocalTime.parse(normalizujVrijeme(doVrijeme));
            LocalTime sada = LocalTime.now();

            if (from.equals(to)) {
                return true;
            }
            if (from.isBefore(to)) {

                return !sada.isBefore(from) && sada.isBefore(to);
            } else {

                return !sada.isBefore(from) || sada.isBefore(to);
            }
        } catch (Exception e) {

            return true;
        }
    }

    private String normalizujVrijeme(String vrijeme) {

        String v = vrijeme.trim();

        return v.length() >= 5 ? v.substring(0, 5) : v;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> kreirajNarudzbu(@RequestBody NarudzbaDTO dto, Authentication authentication) {
        
        if (authentication == null) {
        
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Niste autentifikovani!");
        }

        String ulogovaniUsername = authentication.getName();
        KorisnikEntity ulogovaniKupac = korisnikRepository.findByKorisnickoIme(ulogovaniUsername)
                .orElseThrow(() -> new RuntimeException("Ulogovani korisnik nije pronađen!"));

        KorisnikEntity restoran = korisnikRepository.findById(dto.getRestoranId())
                .orElseThrow(() -> new RuntimeException("Restoran nije pronađen sa ID: " + dto.getRestoranId()));

        KlijentEntity klijentRestorana = klijentRepository.findById(dto.getRestoranId()).orElse(null);
        
        if (klijentRestorana != null
                && !jeRestoranOtvoren(klijentRestorana.getRadnoVrijemeOd(), klijentRestorana.getRadnoVrijemeDo())) {
            
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Restoran je trenutno zatvoren. Narudžbe su moguće samo u radno vrijeme ("
                            + klijentRestorana.getRadnoVrijemeOd() + " - " + klijentRestorana.getRadnoVrijemeDo() + ").");
        }

        NarudzbaEntity narudzba = new NarudzbaEntity();
        narudzba.setKupac(ulogovaniKupac);
        narudzba.setRestoran(restoran);
        narudzba.setAdresaDostave(dto.getAdresaDostave());
        narudzba.setUkupnaCijena(dto.getUkupnaCijena());
        narudzba.setStatus("KREIRANA");
        narudzba.setSifra("ORD-" + System.currentTimeMillis());

        NarudzbaEntity sacuvana = narudzbaRepository.save(narudzba);

        if (dto.getStavke() != null && !dto.getStavke().isEmpty()) {

            for (NarudzbaDTO.StavkaDTO sDTO : dto.getStavke()) {

                if ("VRECICA".equalsIgnoreCase(sDTO.getTipStavke())) {
                    
                    VrecicaIznenadjenjaEntity vrecica = vrecicaIznenadjenjaRepository.findById(sDTO.getJeloId())
                            .orElseThrow(() -> new RuntimeException("Vrećica nije pronađena"));

                    if (vrecica.getKolicina() < sDTO.getKolicina()) {

                        throw new RuntimeException("Nema dovoljno vrećica na stanju!");
                    }

                    vrecica.setKolicina(vrecica.getKolicina() - sDTO.getKolicina());
                    vrecicaIznenadjenjaRepository.save(vrecica);
                }

                StavkaNarudzbeEntity stavka = new StavkaNarudzbeEntity();
                stavka.setIdNarudzbe(sacuvana.getId());
                stavka.setIdJela(sDTO.getJeloId());
                stavka.setTipStavke(sDTO.getTipStavke());
                stavka.setKolicina(sDTO.getKolicina());
                stavka.setCijena(sDTO.getCijena());
                stavkaNarudzbeRepository.save(stavka);
            }
        }

        Map<String, Object> notifikacija = new HashMap<>();
        notifikacija.put("tip", "NOVA_NARUDZBA");
        notifikacija.put("narudzbaId", sacuvana.getId());
        notifikacija.put("sifra", sacuvana.getSifra());
        notifikacija.put("ukupnaCijena", sacuvana.getUkupnaCijena());
        notifikacija.put("adresaDostave", sacuvana.getAdresaDostave());
        messagingTemplate.convertAndSend("/topic/restoran/" + dto.getRestoranId(), (Object) notifikacija);

        return ResponseEntity.ok(sacuvana);
    }

    @GetMapping("/restoran/{restoranId}")
    public ResponseEntity<?> getNarudzbeZaRestoran(@PathVariable("restoranId") Long restoranId, Authentication authentication) {
        
        if (authentication == null) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Niste autentifikovani!");
        }

        String ulogovaniUsername = authentication.getName();

        KorisnikEntity ulogovaniKorisnik = korisnikRepository.findByKorisnickoIme(ulogovaniUsername).orElse(null);

        if (ulogovaniKorisnik == null || !ulogovaniKorisnik.getId().equals(restoranId)) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Nemate dozvolu da gledate narudžbe drugog restorana!");
        }

        return ResponseEntity.ok(narudzbaRepository.findByRestoranId(restoranId));
    }

    @GetMapping("/kupac/{kupacId}")
    public ResponseEntity<?> getNarudzbeZaKupca(@PathVariable("kupacId") Long kupacId, Authentication authentication) {

        if (authentication == null) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Niste autentifikovani!");
        }

        String ulogovaniUsername = authentication.getName();
        KorisnikEntity ulogovaniKorisnik = korisnikRepository.findByKorisnickoIme(ulogovaniUsername).orElse(null);

        if (ulogovaniKorisnik == null || !ulogovaniKorisnik.getId().equals(kupacId)) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Nemate dozvolu da gledate narudžbe drugog kupca!");
        }

        return ResponseEntity.ok(narudzbaRepository.findByKupacId(kupacId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> promjeniStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") String status,
            Authentication authentication) {

        try {

            if (authentication == null) {

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Niste autentifikovani!");
            }

            NarudzbaEntity narudzba = narudzbaRepository.findById(id).orElse(null);

            if (narudzba == null) {

                return ResponseEntity.badRequest().body("Narudžba sa ID " + id + " nije pronađena!");
            }

            String ulogovaniUsername = authentication.getName();
            KorisnikEntity ulogovaniKorisnik = korisnikRepository.findByKorisnickoIme(ulogovaniUsername).orElse(null);

            if (ulogovaniKorisnik == null || !narudzba.getRestoran().getId().equals(ulogovaniKorisnik.getId())) {
                
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Nemate dozvolu da menjate status narudžbe koja ne pripada vašem restoranu!");
            }

            if (narudzba.getSifra() == null || narudzba.getSifra().isEmpty()) {

                narudzba.setSifra("ORD-" + System.currentTimeMillis());
            }

            narudzba.setStatus(status);
            narudzbaRepository.save(narudzba);

            return ResponseEntity.ok("Status uspešno promenjen u: " + status);
        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.status(500).body("Greška pri izmeni statusa: " + e.getMessage());
        }
    }
}
