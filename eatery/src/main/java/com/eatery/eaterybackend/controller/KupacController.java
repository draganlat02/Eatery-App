package com.eatery.eaterybackend.controller;

import com.eatery.eaterybackend.dto.*;
import com.eatery.eaterybackend.entity.*;
import com.eatery.eaterybackend.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/kupac")
@CrossOrigin(origins = "*")
public class KupacController {

    private final KorisnikRepository korisnikRepository;
    private final KupacRepository kupacRepository; // Dodato
    private final JeloRepository jeloRepository;
    private final NarudzbaRepository narudzbaRepository;
    private final StavkaNarudzbeRepository stavkaNarudzbeRepository;

    public KupacController(KorisnikRepository korisnikRepository,
                           KupacRepository kupacRepository,
                           JeloRepository jeloRepository,
                           NarudzbaRepository narudzbaRepository,
                           StavkaNarudzbeRepository stavkaNarudzbeRepository) {
        this.korisnikRepository = korisnikRepository;
        this.kupacRepository = kupacRepository;
        this.jeloRepository = jeloRepository;
        this.narudzbaRepository = narudzbaRepository;
        this.stavkaNarudzbeRepository = stavkaNarudzbeRepository;
    }

    // Preuzimanje podataka za profil kupca (Osnovni podaci + Kupljene vrećice + Ušteda)
    @GetMapping("/profil/{kupacId}")
    public ResponseEntity<?> getProfilKupca(@PathVariable Long kupacId) {
        // 1. Pronađi korisnika
        KorisnikEntity korisnik = korisnikRepository.findById(kupacId)
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen sa ID: " + kupacId));

        // 2. Blokiraj ako korisnik nije uloga "KUPAC" (npr. ako je "KLIJENT" ili "ADMIN")
        if (korisnik.getUloga() == null || !"KUPAC".equalsIgnoreCase(korisnik.getUloga())) {
            return ResponseEntity.status(400).body("Korisnik sa ID " + kupacId + " nije kupac.");
        }

        // 3. Pronađi specifične podatke kupca iz tabele 'kupac'
        KupacEntity kupac = kupacRepository.findById(kupacId).orElse(null);

        Long ukupnoVrecica = narudzbaRepository.prebrojVrecicePoKupcu(kupacId);
        BigDecimal ukupnaUsteda = narudzbaRepository.izracunajUsteduPoKupcu(kupacId);

        KupacProfilDTO dto = new KupacProfilDTO();
        dto.setIdKorisnika(korisnik.getId());
        dto.setEmail(korisnik.getEmail());
        dto.setKorisnickoIme(korisnik.getKorisnickoIme());

        if (kupac != null) {
            dto.setIme(kupac.getIme());
            dto.setCestiKupac(kupac.getCestiKupac());
            dto.setPopust(kupac.getPopust());
        }

        dto.setUkupnoVrecica(ukupnoVrecica != null ? ukupnoVrecica : 0L);
        dto.setUkupnaUstedaKM(ukupnaUsteda != null ? ukupnaUsteda : BigDecimal.ZERO);

        return ResponseEntity.ok(dto);
    }
    // Preuzimanje svih aktiviranih restorana
    @GetMapping("/restorani")
    public ResponseEntity<List<KorisnikEntity>> getAktivniRestorani() {
        return ResponseEntity.ok(korisnikRepository.findAll().stream()
                .filter(k -> "KLIJENT".equals(k.getUloga()) && Boolean.TRUE.equals(k.getAktiviran()))
                .toList());
    }

    // Slanje narudžbe
    @PostMapping("/narudzba")
    @Transactional
    public ResponseEntity<?> kreirajNarudzbu(@RequestBody KreirajNarudzbuDTO dto) {
        KorisnikEntity kupac = korisnikRepository.findById(dto.getKupacId())
                .orElseThrow(() -> new RuntimeException("Kupac nije pronađen sa ID: " + dto.getKupacId()));

        KorisnikEntity restoran = korisnikRepository.findById(dto.getRestoranId())
                .orElseThrow(() -> new RuntimeException("Restoran nije pronađen sa ID: " + dto.getRestoranId()));

        NarudzbaEntity narudzba = new NarudzbaEntity();
        narudzba.setKupac(kupac);
        narudzba.setRestoran(restoran);
        narudzba.setAdresaDostave(dto.getAdresaDostave());
        narudzba.setUkupnaCijena(BigDecimal.ZERO);

        NarudzbaEntity sacuvanaNarudzba = narudzbaRepository.save(narudzba);

        BigDecimal ukupno = BigDecimal.ZERO;

        for (StavkaNarudzbeDTO sDTO : dto.getStavke()) {
            JeloEntity jelo = jeloRepository.findById(sDTO.getJeloId())
                    .orElseThrow(() -> new RuntimeException("Jelo nije pronađeno sa ID: " + sDTO.getJeloId()));

            StavkaNarudzbeEntity stavka = new StavkaNarudzbeEntity();
            stavka.setIdNarudzbe(sacuvanaNarudzba.getId());
            stavka.setIdJela(sDTO.getJeloId());
            stavka.setKolicina(sDTO.getKolicina());

            BigDecimal cijenaStavke = jelo.getCijena().multiply(BigDecimal.valueOf(sDTO.getKolicina()));
            stavka.setCijena(cijenaStavke);

            stavkaNarudzbeRepository.save(stavka);
            ukupno = ukupno.add(cijenaStavke);
        }

        sacuvanaNarudzba.setUkupnaCijena(ukupno);
        narudzbaRepository.save(sacuvanaNarudzba);

        return ResponseEntity.ok("Narudžba uspešno poslana!");
    }

    // Preuzimanje jela za izabrani restoran
    @GetMapping("/restoran/{restoranId}/jela")
    public ResponseEntity<List<JeloEntity>> getJelaZaRestoran(@PathVariable Long restoranId) {
        return ResponseEntity.ok(jeloRepository.findAll().stream()
                .filter(j -> j.getRestoran() != null && restoranId.equals(j.getRestoran().getId()))
                .toList());
    }

    @GetMapping("/narudzbe/{kupacId}")
    public ResponseEntity<List<MojeNarudzbeDTO>> getNarudzbeKupca(@PathVariable Long kupacId) {
        List<NarudzbaEntity> narudzbe = narudzbaRepository.findByKupacId(kupacId);

        List<MojeNarudzbeDTO> result = narudzbe.stream().map(n -> {
            MojeNarudzbeDTO dto = new MojeNarudzbeDTO();
            dto.setId(n.getId());
            dto.setSifra(n.getSifra());
            dto.setStatus(n.getStatus());
            dto.setUkupnaCijena(n.getUkupnaCijena());
            dto.setAdresaDostave(n.getAdresaDostave());
            dto.setVrijemeKreiranja(n.getVrijemeIDatum());

            if (n.getRestoran() != null) {
                dto.setRestoranNaziv(n.getRestoran().getKorisnickoIme());
            }

            List<StavkaNarudzbeEntity> stavkeEnt = stavkaNarudzbeRepository.findByIdNarudzbe(n.getId());
            List<MojeNarudzbeDTO.StavkaPregledDTO> stavkeDTO = stavkeEnt.stream().map(s -> {
                MojeNarudzbeDTO.StavkaPregledDTO sd = new MojeNarudzbeDTO.StavkaPregledDTO();
                sd.setKolicina(s.getKolicina());
                sd.setCijena(s.getCijena());
                jeloRepository.findById(s.getIdJela()).ifPresent(j -> sd.setNazivJela(j.getNaziv()));
                return sd;
            }).toList();

            dto.setStavke(stavkeDTO);
            return dto;
        }).toList();

        return ResponseEntity.ok(result);
    }
}