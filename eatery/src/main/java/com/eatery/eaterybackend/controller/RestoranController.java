package com.eatery.eaterybackend.controller;

import com.eatery.eaterybackend.dto.*;
import com.eatery.eaterybackend.entity.*;
import com.eatery.eaterybackend.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restoran")
@CrossOrigin(origins = "*")
public class RestoranController {

    private final KategorijaRepository kategorijaRepository;
    private final JeloRepository jeloRepository;
    private final KorisnikRepository korisnikRepository;
    private final NarudzbaRepository narudzbaRepository;
    private final StavkaNarudzbeRepository stavkaNarudzbeRepository; // Dodato polje

    public RestoranController(KategorijaRepository kategorijaRepository,
                              JeloRepository jeloRepository,
                              KorisnikRepository korisnikRepository,
                              NarudzbaRepository narudzbaRepository,
                              StavkaNarudzbeRepository stavkaNarudzbeRepository) { // Ubrizgavanje u konstruktor
        this.kategorijaRepository = kategorijaRepository;
        this.jeloRepository = jeloRepository;
        this.korisnikRepository = korisnikRepository;
        this.narudzbaRepository = narudzbaRepository;
        this.stavkaNarudzbeRepository = stavkaNarudzbeRepository;
    }

    @GetMapping("/{restoranId}/kategorije")
    @Transactional(readOnly = true)
    public ResponseEntity<List<KategorijaEntity>> getKategorije(@PathVariable Long restoranId) {
        return ResponseEntity.ok(kategorijaRepository.findByRestoranId(restoranId));
    }

    @PostMapping("/{restoranId}/kategorije")
    public ResponseEntity<?> dodajKategoriju(@PathVariable Long restoranId, @RequestBody KategorijaDTO dto) {
        KorisnikEntity restoran = korisnikRepository.findById(restoranId)
                .orElseThrow(() -> new RuntimeException("Restoran nije pronađen"));

        KategorijaEntity kat = new KategorijaEntity();
        kat.setNaziv(dto.getNaziv());
        kat.setRestoran(restoran);

        return ResponseEntity.ok(kategorijaRepository.save(kat));
    }

    @GetMapping("/{restoranId}/jela")
    @Transactional(readOnly = true)
    public ResponseEntity<List<JeloEntity>> getJela(@PathVariable Long restoranId) {
        return ResponseEntity.ok(jeloRepository.findByRestoranId(restoranId));
    }

    @PostMapping("/{restoranId}/jela")
    public ResponseEntity<?> dodajJelo(@PathVariable Long restoranId, @RequestBody JeloDTO dto) {
        KorisnikEntity restoran = korisnikRepository.findById(restoranId)
                .orElseThrow(() -> new RuntimeException("Restoran nije pronađen"));

        KategorijaEntity kat = kategorijaRepository.findById(dto.getKategorijaId())
                .orElseThrow(() -> new RuntimeException("Kategorija nije pronađena"));

        JeloEntity jelo = new JeloEntity();
        jelo.setNaziv(dto.getNaziv());
        jelo.setOpis(dto.getOpis());
        jelo.setCijena(dto.getCijena());
        jelo.setKategorija(kat);
        jelo.setRestoran(restoran);

        return ResponseEntity.ok(jeloRepository.save(jelo));
    }

    // Preuzimanje svih narudžbi za određeni restoran: /api/restoran/{restoranId}/narudzbe
    @GetMapping("/{restoranId}/narudzbe")
    public ResponseEntity<List<MojeNarudzbeDTO>> getNarudzbeZaRestoran(@PathVariable Long restoranId) {
        List<NarudzbaEntity> narudzbe = narudzbaRepository.findByRestoranId(restoranId);

        List<MojeNarudzbeDTO> result = narudzbe.stream().map(n -> {
            MojeNarudzbeDTO dto = new MojeNarudzbeDTO();
            dto.setId(n.getId());
            dto.setSifra(n.getSifra());
            dto.setStatus(n.getStatus());
            dto.setUkupnaCijena(n.getUkupnaCijena());
            dto.setAdresaDostave(n.getAdresaDostave());
            dto.setVrijemeKreiranja(n.getVrijemeIDatum());

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

    // Izmena statusa narudžbe: /api/restoran/narudzba/{narudzbaId}/status
    @PutMapping("/narudzba/{narudzbaId}/status")
    public ResponseEntity<?> promijeniStatusNarudzbe(@PathVariable Long narudzbaId, @RequestBody String noviStatus) {
        NarudzbaEntity narudzba = narudzbaRepository.findById(narudzbaId)
                .orElseThrow(() -> new RuntimeException("Narudžba nije pronađena pod ID: " + narudzbaId));

        String cistiStatus = noviStatus.replace("\"", "").trim();
        narudzba.setStatus(cistiStatus);

        narudzbaRepository.save(narudzba);

        return ResponseEntity.ok("Status uspešno izmenjen!");
    }
}