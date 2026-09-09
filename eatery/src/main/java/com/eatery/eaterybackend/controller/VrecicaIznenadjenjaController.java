package com.eatery.eaterybackend.controller;

import com.eatery.eaterybackend.dto.VrecicaIznenadjenjaDTO;
import com.eatery.eaterybackend.entity.KorisnikEntity;
import com.eatery.eaterybackend.entity.VrecicaIznenadjenjaEntity;
import com.eatery.eaterybackend.repository.KorisnikRepository;
import com.eatery.eaterybackend.repository.VrecicaIznenadjenjaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vrecice")
@CrossOrigin(origins = "*")
public class VrecicaIznenadjenjaController {

    private final VrecicaIznenadjenjaRepository vrecicaRepository;
    private final KorisnikRepository korisnikRepository;

    public VrecicaIznenadjenjaController(VrecicaIznenadjenjaRepository vrecicaRepository,
                                         KorisnikRepository korisnikRepository) {
        this.vrecicaRepository = vrecicaRepository;
        this.korisnikRepository = korisnikRepository;
    }

    // 1. DOHVAT SVIH AKTIVNIH VREĆICA (Za vrh početne stranice kod Kupca)
    @GetMapping("/aktivne")
    public ResponseEntity<List<VrecicaIznenadjenjaEntity>> getAktivneVrecice() {
        return ResponseEntity.ok(vrecicaRepository.findByAktivnaTrueAndKolicinaGreaterThan(0));
    }

    // 2. DOHVAT VREĆICA ZA ODREĐENI RESTORAN (Za Restoranski panel)
    @GetMapping("/restoran/{restoranId}")
    public ResponseEntity<List<VrecicaIznenadjenjaEntity>> getVreciceZaRestoran(@PathVariable Long restoranId) {
        return ResponseEntity.ok(vrecicaRepository.findByRestoranId(restoranId));
    }

    // 3. KREIRANJE NOVE VREĆICE IZNENAĐENJA (Restoran objavljuje)
    @PostMapping("/restoran/{restoranId}")
    public ResponseEntity<?> dodajVrecicu(@PathVariable Long restoranId, @RequestBody VrecicaIznenadjenjaDTO dto) {
        KorisnikEntity restoran = korisnikRepository.findById(restoranId)
                .orElseThrow(() -> new RuntimeException("Restoran nije pronađen"));

        VrecicaIznenadjenjaEntity vrecica = new VrecicaIznenadjenjaEntity();
        vrecica.setRestoran(restoran);
        vrecica.setNaziv(dto.getNaziv());
        vrecica.setOpis(dto.getOpis());
        vrecica.setOriginalnaCijena(dto.getOriginalnaCijena());
        vrecica.setAkcijskaCijena(dto.getAkcijskaCijena());
        vrecica.setKolicina(dto.getKolicina());
        vrecica.setVrijemePreuzimanjaOd(dto.getVrijemePreuzimanjaOd());
        vrecica.setVrijemePreuzimanjaDo(dto.getVrijemePreuzimanjaDo());
        vrecica.setAktivna(dto.getAktivna() != null ? dto.getAktivna() : true);

        return ResponseEntity.ok(vrecicaRepository.save(vrecica));
    }

    // 4. BRZA PROMENA STATUSI (Uključi / Isključi vrećicu na panelu)
    @PutMapping("/{vrecicaId}/status")
    public ResponseEntity<?> promijeniStatus(@PathVariable Long vrecicaId, @RequestParam Boolean aktivna) {
        VrecicaIznenadjenjaEntity vrecica = vrecicaRepository.findById(vrecicaId)
                .orElseThrow(() -> new RuntimeException("Vrećica nije pronađena"));

        vrecica.setAktivna(aktivna);
        vrecicaRepository.save(vrecica);

        return ResponseEntity.ok("Status vrećice uspešno promenjen!");
    }

    // 5. BRZO AŽURIRANJE KOLIČINE
    @PutMapping("/{vrecicaId}/kolicina")
    public ResponseEntity<?> azurirajKolicinu(@PathVariable Long vrecicaId, @RequestParam Integer kolicina) {
        VrecicaIznenadjenjaEntity vrecica = vrecicaRepository.findById(vrecicaId)
                .orElseThrow(() -> new RuntimeException("Vrećica nije pronađena"));

        vrecica.setKolicina(kolicina);
        vrecicaRepository.save(vrecica);

        return ResponseEntity.ok("Količina vrećice uspešno ažurirana!");
    }
}