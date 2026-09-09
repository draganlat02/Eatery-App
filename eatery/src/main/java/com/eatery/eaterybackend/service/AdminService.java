package com.eatery.eaterybackend.service;

import com.eatery.eaterybackend.entity.KorisnikEntity;
import com.eatery.eaterybackend.entity.ZahtjevZaAktivacijuEntity;
import com.eatery.eaterybackend.repository.KorisnikRepository;
import com.eatery.eaterybackend.repository.ZahtjevZaAktivacijuRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {

    private final ZahtjevZaAktivacijuRepository zahtjevRepository;
    private final KorisnikRepository korisnikRepository;

    public AdminService(ZahtjevZaAktivacijuRepository zahtjevRepository, KorisnikRepository korisnikRepository) {
        this.zahtjevRepository = zahtjevRepository;
        this.korisnikRepository = korisnikRepository;
    }

    @Transactional(readOnly = true) // <-- DODAJ OVU ANOTACIJU
    public List<ZahtjevZaAktivacijuEntity> getSveZahtjeve() {
        return zahtjevRepository.findAll();
    }

    @Transactional
    public String obradiZahtjev(Long idZahtjeva, boolean odobreno) {
        ZahtjevZaAktivacijuEntity zahtjev = zahtjevRepository.findById(idZahtjeva)
                .orElseThrow(() -> new RuntimeException("Zahtjev nije pronađen!"));

        KorisnikEntity korisnik = zahtjev.getKorisnik();

        if (odobreno) {
            korisnik.setAktiviran(true);
            korisnikRepository.save(korisnik);
            zahtjevRepository.delete(zahtjev);
            return "Nalog je uspješno aktiviran!";
        } else {
            zahtjevRepository.delete(zahtjev);
            korisnikRepository.delete(korisnik);
            return "Zahtjev je odbijen i nalog je obrisan!";
        }
    }
}