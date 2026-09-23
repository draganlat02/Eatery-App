package com.eatery.eaterybackend.controller;

import com.eatery.eaterybackend.dto.VrecicaIznenadjenjaDTO;
import com.eatery.eaterybackend.entity.KorisnikEntity;
import com.eatery.eaterybackend.entity.VrecicaIznenadjenjaEntity;
import com.eatery.eaterybackend.repository.KorisnikRepository;
import com.eatery.eaterybackend.repository.VrecicaIznenadjenjaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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

    // Pomoćna metoda za provjeru autorizacije restorana
    private boolean isRestoranOvlascen(Long trazeniRestoranId, Authentication authentication) {
        if (authentication == null) return false;
        String ulogovaniUsername = authentication.getName();
        KorisnikEntity ulogovani = korisnikRepository.findByKorisnickoIme(ulogovaniUsername).orElse(null);
        return ulogovani != null && ulogovani.getId().equals(trazeniRestoranId);
    }

    // 1. DOHVAT SVIH AKTIVNIH VREĆICA (Javna ruta za ulogovane kupce)
    @GetMapping("/aktivne")
    public ResponseEntity<List<VrecicaIznenadjenjaEntity>> getAktivneVrecice() {
        return ResponseEntity.ok(vrecicaRepository.findByAktivnaTrueAndKolicinaGreaterThan(0));
    }

    // 2. DOHVAT VREĆICA ZA ODREĐENI RESTORAN
    @GetMapping("/restoran/{restoranId}")
    public ResponseEntity<?> getVreciceZaRestoran(@PathVariable Long restoranId, Authentication authentication) {
        if (!isRestoranOvlascen(restoranId, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Nemate dozvolu za uvid u vrećice ovog restorana!");
        }
        return ResponseEntity.ok(vrecicaRepository.findByRestoranId(restoranId));
    }

    // 3. KREIRANJE NOVE VREĆICE IZNENAĐENJA
    @PostMapping("/restoran/{restoranId}")
    public ResponseEntity<?> dodajVrecicu(@PathVariable Long restoranId,
                                          @RequestBody VrecicaIznenadjenjaDTO dto,
                                          Authentication authentication) {
        if (!isRestoranOvlascen(restoranId, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Nemate dozvolu da objavljujete vrećice u ime ovog restorana!");
        }

        KorisnikEntity restoran = korisnikRepository.findById(restoranId)
                .orElseThrow(() -> new RuntimeException("Restoran nije pronađen"));

        VrecicaIznenadjenjaEntity vrecica = new VrecicaIznenadjenjaEntity();
        vrecica.setRestoran(restoran);
        vrecica.setNaziv(dto.getNaziv());
        vrecica.setOpis(dto.getOpis());
        vrecica.setOriginalnaCijena(dto.getOriginalnaCijena());
        vrecica.setAkcijskaCijena(dto.getAkcijskaCijena());
        vrecica.setKolicina(dto.getKolicina());
        vrecica.setTezinaKg(
                dto.getTezinaKg() != null && dto.getTezinaKg().signum() > 0
                        ? dto.getTezinaKg()
                        : java.math.BigDecimal.ONE
        );
        vrecica.setVrijemePreuzimanjaOd(dto.getVrijemePreuzimanjaOd());
        vrecica.setVrijemePreuzimanjaDo(dto.getVrijemePreuzimanjaDo());
        vrecica.setAktivna(dto.getAktivna() != null ? dto.getAktivna() : true);
        vrecica.setAlergijskaUpozorenja(
                dto.getAlergijskaUpozorenja() != null && !dto.getAlergijskaUpozorenja().isBlank()
                        ? dto.getAlergijskaUpozorenja().trim()
                        : null
        );

        return ResponseEntity.ok(vrecicaRepository.save(vrecica));
    }

    // 4. BRZA PROMJENA STATUSA
    @PutMapping("/{vrecicaId}/status")
    public ResponseEntity<?> promijeniStatus(@PathVariable Long vrecicaId,
                                             @RequestParam Boolean aktivna,
                                             Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Niste autentifikovani!");
        }

        VrecicaIznenadjenjaEntity vrecica = vrecicaRepository.findById(vrecicaId)
                .orElseThrow(() -> new RuntimeException("Vrećica nije pronađena"));

        // Provjera da li ulogovani restoran posjeduje traženu vrećicu
        String ulogovaniUsername = authentication.getName();
        KorisnikEntity ulogovani = korisnikRepository.findByKorisnickoIme(ulogovaniUsername).orElse(null);

        if (ulogovani == null || !vrecica.getRestoran().getId().equals(ulogovani.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Nemate dozvolu da mijenjate status tuđe vrećice!");
        }

        vrecica.setAktivna(aktivna);
        vrecicaRepository.save(vrecica);

        return ResponseEntity.ok("Status vrećice uspešno promenjen!");
    }

    // 5. BRZO AŽURIRANJE KOLIČINE
    @PutMapping("/{vrecicaId}/kolicina")
    public ResponseEntity<?> azurirajKolicinu(@PathVariable Long vrecicaId,
                                              @RequestParam Integer kolicina,
                                              Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Niste autentifikovani!");
        }

        VrecicaIznenadjenjaEntity vrecica = vrecicaRepository.findById(vrecicaId)
                .orElseThrow(() -> new RuntimeException("Vrećica nije pronađena"));

        // Provjera da li ulogovani restoran posjeduje traženu vrećicu
        String ulogovaniUsername = authentication.getName();
        KorisnikEntity ulogovani = korisnikRepository.findByKorisnickoIme(ulogovaniUsername).orElse(null);

        if (ulogovani == null || !vrecica.getRestoran().getId().equals(ulogovani.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Nemate dozvolu da mijenjate količinu tuđe vrećice!");
        }

        vrecica.setKolicina(kolicina);
        vrecicaRepository.save(vrecica);

        return ResponseEntity.ok("Količina vrećice uspešno ažurirana!");
    }
}