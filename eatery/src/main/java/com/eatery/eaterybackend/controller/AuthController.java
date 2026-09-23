package com.eatery.eaterybackend.controller;

import com.eatery.eaterybackend.dto.LoginRequestDTO;
import com.eatery.eaterybackend.dto.LoginResponseDTO;
import com.eatery.eaterybackend.dto.RegistracijaKlijentaDTO;
import com.eatery.eaterybackend.dto.RegistracijaKupcaDTO;
import com.eatery.eaterybackend.entity.KorisnikEntity;
import com.eatery.eaterybackend.entity.ZahtjevZaAktivacijuEntity;
import com.eatery.eaterybackend.repository.KorisnikRepository;
import com.eatery.eaterybackend.repository.ZahtjevZaAktivacijuRepository;
import com.eatery.eaterybackend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final KorisnikRepository korisnikRepository;
    private final ZahtjevZaAktivacijuRepository zahtjevRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @PostMapping("/registracija/kupac")
    public ResponseEntity<?> registrujKupca(@RequestBody RegistracijaKupcaDTO dto) {
        if (korisnikRepository.findByKorisnickoIme(dto.getKorisnickoIme()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Korisničko ime je već zauzeto!"));
        }

        KorisnikEntity korisnik = new KorisnikEntity();
        korisnik.setKorisnickoIme(dto.getKorisnickoIme());
        // Heširanje šifre prije čuvanja u bazu
        korisnik.setSifra(passwordEncoder.encode(dto.getSifra()));
        korisnik.setEmail(dto.getEmail());
        korisnik.setUloga("KUPAC");
        korisnik.setAktiviran(true);

        korisnikRepository.save(korisnik);
        return ResponseEntity.ok(korisnik);
    }

    @PostMapping("/registracija/klijent")
    public ResponseEntity<?> registrujKlijenta(@RequestBody RegistracijaKlijentaDTO dto) {
        if (korisnikRepository.findByKorisnickoIme(dto.getKorisnickoIme()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Korisničko ime je već zauzeto!"));
        }

        KorisnikEntity korisnik = new KorisnikEntity();
        korisnik.setKorisnickoIme(dto.getKorisnickoIme());
        // Heširanje šifre prije čuvanja u bazu
        korisnik.setSifra(passwordEncoder.encode(dto.getSifra()));
        korisnik.setEmail(dto.getEmail());
        korisnik.setUloga("KLIJENT");
        korisnik.setAktiviran(false);

        KorisnikEntity sacuvaniKorisnik = korisnikRepository.save(korisnik);

        ZahtjevZaAktivacijuEntity zahtjev = new ZahtjevZaAktivacijuEntity();
        zahtjev.setKorisnik(sacuvaniKorisnik);
        zahtjevRepository.save(zahtjev);

        return ResponseEntity.ok(sacuvaniKorisnik);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO dto) {
        Optional<KorisnikEntity> korisnikOpt = korisnikRepository.findByKorisnickoIme(dto.getKorisnickoIme());

        if (korisnikOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Neispravno korisničko ime ili lozinka!"));
        }

        KorisnikEntity korisnik = korisnikOpt.get();

        // Podržava i heširane (BCrypt) i obične (plain-text) šifre radi kompatibilnosti sa postojećim korisnicima u bazi
        boolean isSifraIsprvana = passwordEncoder.matches(dto.getSifra(), korisnik.getSifra())
                || korisnik.getSifra().equals(dto.getSifra());

        if (!isSifraIsprvana) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Neispravno korisničko ime ili lozinka!"));
        }

        if (!Boolean.TRUE.equals(korisnik.getAktiviran())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Nalog još uvijek nije aktiviran od strane administratora!"));
        }

        // Generisanje JWT tokena
        String token = jwtUtils.generateToken(
                korisnik.getKorisnickoIme(),
                korisnik.getUloga(),
                korisnik.getId()
        );

        // Vraćamo DTO koji sadrži i token i osnove korisničke podatke
        LoginResponseDTO response = new LoginResponseDTO(
                token,
                korisnik.getId(),
                korisnik.getKorisnickoIme(),
                korisnik.getUloga(),
                null // Proširi ako KorisnikEntity ima getNazivObjekta()
        );

        return ResponseEntity.ok(response);
    }
}