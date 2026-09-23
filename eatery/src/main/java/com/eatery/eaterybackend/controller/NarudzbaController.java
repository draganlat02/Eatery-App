package com.eatery.eaterybackend.controller;

import com.eatery.eaterybackend.dto.NarudzbaDTO;
import com.eatery.eaterybackend.entity.*;
import com.eatery.eaterybackend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api/narudzbe")
public class NarudzbaController {

    private final NarudzbaRepository narudzbaRepository;
    private final KorisnikRepository korisnikRepository;
    private final StavkaNarudzbeRepository stavkaNarudzbeRepository;
    private final VrecicaIznenadjenjaRepository vrecicaIznenadjenjaRepository;

    public NarudzbaController(NarudzbaRepository narudzbaRepository,
                              KorisnikRepository korisnikRepository,
                              StavkaNarudzbeRepository stavkaNarudzbeRepository,
                              VrecicaIznenadjenjaRepository vrecicaIznenadjenjaRepository) {
        this.narudzbaRepository = narudzbaRepository;
        this.korisnikRepository = korisnikRepository;
        this.stavkaNarudzbeRepository = stavkaNarudzbeRepository;
        this.vrecicaIznenadjenjaRepository = vrecicaIznenadjenjaRepository;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> kreirajNarudzbu(@RequestBody NarudzbaDTO dto, Authentication authentication) {
        // PROVJERA: Korisnik mora biti ulogovan
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Niste autentifikovani!");
        }

        // Pronalaženje ulogovanog korisnika iz JWT-a
        String ulogovaniUsername = authentication.getName();
        KorisnikEntity ulogovaniKupac = korisnikRepository.findByKorisnickoIme(ulogovaniUsername)
                .orElseThrow(() -> new RuntimeException("Ulogovani korisnik nije pronađen!"));

        KorisnikEntity restoran = korisnikRepository.findById(dto.getRestoranId())
                .orElseThrow(() -> new RuntimeException("Restoran nije pronađen sa ID: " + dto.getRestoranId()));

        NarudzbaEntity narudzba = new NarudzbaEntity();
        // Osiguravamo da se narudžba kreira na ime ULOGOVANOG kupca (iz JWT-a), a ne na proizvoljan ID iz DTO-a
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
        return ResponseEntity.ok(sacuvana);
    }

    @GetMapping("/restoran/{restoranId}")
    public ResponseEntity<?> getNarudzbeZaRestoran(@PathVariable("restoranId") Long restoranId, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Niste autentifikovani!");
        }

        // PROVJERA: Da li je ulogovani korisnik zaista vlasnik ovog restorana?
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

        // PROVJERA: Da li ulogovani kupac traži SVOJE narudžbe?
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

            // PROVJERA VLASNIŠTVA: Da li narudžba pripada restoranu koji je ulogovan?
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