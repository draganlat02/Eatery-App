package com.eatery.eaterybackend.controller;

import com.eatery.eaterybackend.dto.NarudzbaDTO;
import com.eatery.eaterybackend.entity.NarudzbaEntity;
import com.eatery.eaterybackend.entity.StavkaNarudzbeEntity;
import com.eatery.eaterybackend.entity.*;
import com.eatery.eaterybackend.repository.NarudzbaRepository;
import com.eatery.eaterybackend.repository.*;
import com.eatery.eaterybackend.repository.KorisnikRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

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
                              StavkaNarudzbeRepository stavkaNarudzbeRepository, VrecicaIznenadjenjaRepository vrecicaIznenadjenjaRepository) {
        this.narudzbaRepository = narudzbaRepository;
        this.korisnikRepository = korisnikRepository;
        this.stavkaNarudzbeRepository = stavkaNarudzbeRepository;
        this.vrecicaIznenadjenjaRepository = vrecicaIznenadjenjaRepository;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> kreirajNarudzbu(@RequestBody NarudzbaDTO dto) {
        if (dto.getKupacId() == null || dto.getRestoranId() == null) {
            return ResponseEntity.badRequest().body("Kupac ID i Restoran ID moraju biti prosleđeni!");
        }

        KorisnikEntity kupac = korisnikRepository.findById(dto.getKupacId())
                .orElseThrow(() -> new RuntimeException("Kupac nije pronađen sa ID: " + dto.getKupacId()));

        KorisnikEntity restoran = korisnikRepository.findById(dto.getRestoranId())
                .orElseThrow(() -> new RuntimeException("Restoran nije pronađen sa ID: " + dto.getRestoranId()));

        NarudzbaEntity narudzba = new NarudzbaEntity();
        narudzba.setKupac(kupac);
        narudzba.setRestoran(restoran);
        narudzba.setAdresaDostave(dto.getAdresaDostave());
        narudzba.setUkupnaCijena(dto.getUkupnaCijena());
        narudzba.setStatus("KREIRANA");
        narudzba.setSifra("ORD-" + System.currentTimeMillis());

        NarudzbaEntity sacuvana = narudzbaRepository.save(narudzba);

        // Unutar metode za kreiranje narudžbe, kada obrađujete stavke:
        if (dto.getStavke() != null && !dto.getStavke().isEmpty()) {
            for (NarudzbaDTO.StavkaDTO sDTO : dto.getStavke()) {

                // Ako je stavka vrećica iznenađenja
                if ("VRECICA".equalsIgnoreCase(sDTO.getTipStavke())) {
                    VrecicaIznenadjenjaEntity vrecica = vrecicaIznenadjenjaRepository.findById(sDTO.getJeloId())
                            .orElseThrow(() -> new RuntimeException("Vrećica nije pronađena"));

                    // Provera da li ima dovoljno na stanju
                    if (vrecica.getKolicina() < sDTO.getKolicina()) {
                        throw new RuntimeException("Nema dovoljno vrećica na stanju!");
                    }

                    // Smanjujemo količinu i čuvamo u bazi
                    vrecica.setKolicina(vrecica.getKolicina() - sDTO.getKolicina());
                    vrecicaIznenadjenjaRepository.save(vrecica);
                }

                // Sačuvaj stavku narudžbe u bazu
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
    public ResponseEntity<List<NarudzbaEntity>> getNarudzbeZaRestoran(@PathVariable("restoranId") Long restoranId) {
        return ResponseEntity.ok(narudzbaRepository.findByRestoranId(restoranId));
    }

    @GetMapping("/kupac/{kupacId}")
    public ResponseEntity<List<NarudzbaEntity>> getNarudzbeZaKupca(@PathVariable("kupacId") Long kupacId) {
        return ResponseEntity.ok(narudzbaRepository.findByKupacId(kupacId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> promjeniStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") String status) {
        try {
            NarudzbaEntity narudzba = narudzbaRepository.findById(id).orElse(null);

            if (narudzba == null) {
                return ResponseEntity.badRequest().body("Narudžba sa ID " + id + " nije pronađena!");
            }

            // Generiše šifru ako iz nekog razloga fali u bazi (sprečava NOT NULL error)
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