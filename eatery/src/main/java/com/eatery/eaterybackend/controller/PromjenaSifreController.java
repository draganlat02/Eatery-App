package com.eatery.eaterybackend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eatery.eaterybackend.dto.PromjenaSifreDTO;
import com.eatery.eaterybackend.entity.KorisnikEntity;
import com.eatery.eaterybackend.entity.ZahtjevZaPromjenuSifreEntity;
import com.eatery.eaterybackend.repository.KorisnikRepository;
import com.eatery.eaterybackend.repository.ZahtjevZaPromjenuSifreRepository;

@RestController
@RequestMapping("/api/korisnik/promjena-sifre")
@CrossOrigin(origins = "*")
public class PromjenaSifreController {

    private static final int MIN_DUZINA = 6;

    private final KorisnikRepository korisnikRepository;
    private final ZahtjevZaPromjenuSifreRepository zahtjevRepository;
    private final PasswordEncoder passwordEncoder;

    public PromjenaSifreController(KorisnikRepository korisnikRepository,
                                   ZahtjevZaPromjenuSifreRepository zahtjevRepository,
                                   PasswordEncoder passwordEncoder) {
        this.korisnikRepository = korisnikRepository;
        this.zahtjevRepository = zahtjevRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<?> status(Authentication authentication) {
        KorisnikEntity korisnik = ulogovani(authentication);
        if (korisnik == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Niste autentifikovani!"));
        }

        Map<String, Object> odgovor = new HashMap<>();
        zahtjevRepository.findByKorisnikId(korisnik.getId()).ifPresentOrElse(
                z -> {
                    odgovor.put("naCekanju", true);
                    odgovor.put("datumPodnosenja", z.getDatumPodnosenja());
                },
                () -> odgovor.put("naCekanju", false));
        return ResponseEntity.ok(odgovor);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> posaljiZahtjev(@RequestBody PromjenaSifreDTO dto, Authentication authentication) {
        KorisnikEntity korisnik = ulogovani(authentication);
        if (korisnik == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Niste autentifikovani!"));
        }
        if ("ADMINISTRATOR".equalsIgnoreCase(korisnik.getUloga())) {
            return greska("Administrator ne može slati zahtjev za promjenu šifre.");
        }

        String trenutna = dto.getTrenutnaSifra() == null ? "" : dto.getTrenutnaSifra();
        String nova = dto.getNovaSifra() == null ? "" : dto.getNovaSifra();

        if (!sifraOdgovara(trenutna, korisnik.getSifra())) {
            return greska("Trenutna šifra nije ispravna.");
        }
        if (nova.isBlank() || nova.length() < MIN_DUZINA) {
            return greska("Nova šifra mora imati najmanje " + MIN_DUZINA + " znakova.");
        }
        if (sifraOdgovara(nova, korisnik.getSifra())) {
            return greska("Nova šifra mora biti različita od trenutne.");
        }

        ZahtjevZaPromjenuSifreEntity zahtjev = zahtjevRepository.findByKorisnikId(korisnik.getId())
                .orElseGet(ZahtjevZaPromjenuSifreEntity::new);
        boolean zamijenjen = zahtjev.getId() != null;
        zahtjev.setKorisnik(korisnik);
        zahtjev.setNovaSifra(passwordEncoder.encode(nova));
        zahtjev.setDatumPodnosenja(java.time.LocalDateTime.now());
        zahtjevRepository.save(zahtjev);

        String poruka = "Zahtjev za promjenu šifre je poslan administratoru. Nova šifra će važiti nakon odobrenja.";
        if (zamijenjen) {
            poruka += " Prethodni zahtjev je zamijenjen ovim.";
        }
        return ResponseEntity.ok(Map.of("message", poruka));
    }

    private KorisnikEntity ulogovani(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return korisnikRepository.findByKorisnickoIme(authentication.getName()).orElse(null);
    }

    private boolean sifraOdgovara(String unesena, String sacuvana) {
        if (sacuvana == null) {
            return false;
        }
        return passwordEncoder.matches(unesena, sacuvana) || sacuvana.equals(unesena);
    }

    private ResponseEntity<?> greska(String poruka) {
        return ResponseEntity.badRequest().body(Map.of("message", poruka));
    }
}
