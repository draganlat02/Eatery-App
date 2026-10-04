package com.eatery.eaterybackend.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eatery.eaterybackend.dto.LoginRequestDTO;
import com.eatery.eaterybackend.dto.LoginResponseDTO;
import com.eatery.eaterybackend.dto.RegistracijaKlijentaDTO;
import com.eatery.eaterybackend.dto.RegistracijaKupcaDTO;
import com.eatery.eaterybackend.entity.KlijentEntity;
import com.eatery.eaterybackend.entity.KorisnikEntity;
import com.eatery.eaterybackend.entity.KupacEntity;
import com.eatery.eaterybackend.entity.OpisEntity;
import com.eatery.eaterybackend.entity.ZahtjevZaAktivacijuEntity;
import com.eatery.eaterybackend.repository.KorisnikRepository;
import com.eatery.eaterybackend.repository.OpisRepository;
import com.eatery.eaterybackend.repository.ZahtjevZaAktivacijuRepository;
import com.eatery.eaterybackend.security.JwtUtils;
import com.eatery.eaterybackend.util.SuspenzijaUtil;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final KorisnikRepository korisnikRepository;
    private final ZahtjevZaAktivacijuRepository zahtjevRepository;
    private final OpisRepository opisRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @PostMapping("/registracija/kupac")
    public ResponseEntity<?> registrujKupca(@RequestBody RegistracijaKupcaDTO dto) {

        if (korisnikRepository.findByKorisnickoIme(dto.getKorisnickoIme()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Korisničko ime je već zauzeto!"));
        }

        if (dto.getEmail() != null && korisnikRepository.existsByEmail(dto.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email je već zauzet!"));
        }

        if (dto.getIme() == null || dto.getIme().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ime je obavezno!"));
        }

        KupacEntity kupac = new KupacEntity();
        kupac.setKorisnickoIme(dto.getKorisnickoIme());
        kupac.setSifra(passwordEncoder.encode(dto.getSifra()));
        kupac.setEmail(dto.getEmail());
        kupac.setUloga("KUPAC");
        kupac.setAktiviran(true);
        kupac.setIme(dto.getIme().trim());

        korisnikRepository.save(kupac);

        return ResponseEntity.ok(Map.of(
                "message", "Uspješna registracija! Sada se možete prijaviti."
        ));
    }

    @PostMapping("/registracija/klijent")
    public ResponseEntity<?> registrujKlijenta(@RequestBody RegistracijaKlijentaDTO dto) {

        if (korisnikRepository.findByKorisnickoIme(dto.getKorisnickoIme()).isPresent()) {

            return ResponseEntity.badRequest().body(Map.of("message", "Korisničko ime je već zauzeto!"));
        }

        if (dto.getEmail() != null && korisnikRepository.existsByEmail(dto.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email je već zauzet!"));
        }

        if (dto.getNazivObjekta() == null || dto.getNazivObjekta().isBlank()) {

            return ResponseEntity.badRequest().body(Map.of("message", "Naziv objekta je obavezan!"));
        }

        KlijentEntity klijent = new KlijentEntity();
        klijent.setKorisnickoIme(dto.getKorisnickoIme());
        klijent.setSifra(passwordEncoder.encode(dto.getSifra()));
        klijent.setEmail(dto.getEmail());
        klijent.setUloga("KLIJENT");
        klijent.setAktiviran(false);
        klijent.setNazivObjekta(dto.getNazivObjekta().trim());

        if (dto.getOpis() != null && !dto.getOpis().isBlank()) {

            OpisEntity opis = new OpisEntity();
            opis.setTip("RESTORAN");
            opis.setSadrzaj(dto.getOpis().trim());
            opisRepository.save(opis);
            klijent.setOpis(opis);
        }

        KorisnikEntity sacuvaniKorisnik = korisnikRepository.save(klijent);

        ZahtjevZaAktivacijuEntity zahtjev = new ZahtjevZaAktivacijuEntity();
        zahtjev.setKorisnik(sacuvaniKorisnik);
        zahtjevRepository.save(zahtjev);

        return ResponseEntity.ok(Map.of(
                "message", "Zahtjev za registraciju restorana je poslat. Nalog čeka odobrenje administratora."
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO dto) {

        Optional<KorisnikEntity> korisnikOpt = korisnikRepository.findByKorisnickoIme(dto.getKorisnickoIme());

        if (korisnikOpt.isEmpty()) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Neispravno korisničko ime ili lozinka!"));
        }

        KorisnikEntity korisnik = korisnikOpt.get();

        boolean isSifraIsprvana = passwordEncoder.matches(dto.getSifra(), korisnik.getSifra())
                || korisnik.getSifra().equals(dto.getSifra());

        if (!isSifraIsprvana) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Neispravno korisničko ime ili lozinka!"));
        }

        if (SuspenzijaUtil.ocistiAkoIstekla(korisnik)) {
            korisnikRepository.save(korisnik);
        }

        if (SuspenzijaUtil.jeAktivna(korisnik)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", SuspenzijaUtil.poruka(korisnik)));
        }

        if (!"ADMINISTRATOR".equalsIgnoreCase(korisnik.getUloga())
                && !Boolean.TRUE.equals(korisnik.getAktiviran())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Nalog još uvijek nije aktiviran od strane administratora!"));
        }

        String token = jwtUtils.generateToken(
                korisnik.getKorisnickoIme(),
                korisnik.getUloga(),
                korisnik.getId()
        );

        LoginResponseDTO response = new LoginResponseDTO(
                token,
                korisnik.getId(),
                korisnik.getKorisnickoIme(),
                korisnik.getUloga(),
                null
        );

        return ResponseEntity.ok(response);
    }
}
