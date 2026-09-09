package com.eatery.eaterybackend.service;

import com.eatery.eaterybackend.dto.*;
import com.eatery.eaterybackend.entity.*;
import com.eatery.eaterybackend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final KorisnikRepository korisnikRepository;
    private final KupacRepository kupacRepository;
    private final KlijentRepository klijentRepository;
    private final ZahtjevZaAktivacijuRepository zahtjevRepository;

    public AuthService(KorisnikRepository korisnikRepository,
                       KupacRepository kupacRepository,
                       KlijentRepository klijentRepository,
                       ZahtjevZaAktivacijuRepository zahtjevRepository) {
        this.korisnikRepository = korisnikRepository;
        this.kupacRepository = kupacRepository;
        this.klijentRepository = klijentRepository;
        this.zahtjevRepository = zahtjevRepository;
    }

    @Transactional
    public KorisnikResponseDTO registrujKupca(RegistracijaKupcaDTO dto) {
        if (korisnikRepository.existsByKorisnickoIme(dto.getKorisnickoIme())) {
            throw new RuntimeException("Korisničko ime je već zauzeto!");
        }
        if (korisnikRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email je već u upotrebi!");
        }

        KupacEntity kupac = new KupacEntity();
        kupac.setKorisnickoIme(dto.getKorisnickoIme());
        kupac.setSifra(dto.getSifra()); // Napomena: Kasnije dodati BCrypt enkripciju
        kupac.setEmail(dto.getEmail());
        kupac.setIme(dto.getIme());
        kupac.setUloga("KUPAC");
        kupac.setAktiviran(true); // Kupci su odmah aktivni

        KupacEntity sacuvan = kupacRepository.save(kupac);
        return new KorisnikResponseDTO(sacuvan.getId(), sacuvan.getKorisnickoIme(), sacuvan.getEmail(), sacuvan.getUloga(), sacuvan.getAktiviran());
    }

    @Transactional
    public KorisnikResponseDTO registrujKlijenta(RegistracijaKlijentaDTO dto) {
        if (korisnikRepository.existsByKorisnickoIme(dto.getKorisnickoIme())) {
            throw new RuntimeException("Korisničko ime je već zauzeto!");
        }
        if (korisnikRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email je već u upotrebi!");
        }

        KlijentEntity klijent = new KlijentEntity();
        klijent.setKorisnickoIme(dto.getKorisnickoIme());
        klijent.setSifra(dto.getSifra());
        klijent.setEmail(dto.getEmail());
        klijent.setNazivObjekta(dto.getNazivObjekta());
        klijent.setUloga("KLIJENT");
        klijent.setAktiviran(false); // Klijent čeka odobrenje admina

        KlijentEntity sacuvan = klijentRepository.save(klijent);

        // Kreiranje zahtjeva za aktivaciju za admina
        ZahtjevZaAktivacijuEntity zahtjev = new ZahtjevZaAktivacijuEntity();
        zahtjev.setKorisnik(sacuvan);
        zahtjevRepository.save(zahtjev);

        return new KorisnikResponseDTO(sacuvan.getId(), sacuvan.getKorisnickoIme(), sacuvan.getEmail(), sacuvan.getUloga(), sacuvan.getAktiviran());
    }

    public KorisnikResponseDTO login(LoginRequestDTO dto) {
        KorisnikEntity korisnik = korisnikRepository.findByKorisnickoIme(dto.getKorisnickoIme())
                .orElseThrow(() -> new RuntimeException("Pogrešno korisničko ime ili lozinka!"));

        if (!korisnik.getSifra().equals(dto.getSifra())) {
            throw new RuntimeException("Pogrešno korisničko ime ili lozinka!");
        }

        if (!korisnik.getAktiviran()) {
            throw new RuntimeException("Vaš nalog još uvijek nije aktiviran od strane administratora!");
        }

        return new KorisnikResponseDTO(korisnik.getId(), korisnik.getKorisnickoIme(), korisnik.getEmail(), korisnik.getUloga(), korisnik.getAktiviran());
    }
}