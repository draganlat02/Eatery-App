package com.eatery.eaterybackend.controller;

import com.eatery.eaterybackend.dto.*;
import com.eatery.eaterybackend.entity.*;
import com.eatery.eaterybackend.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/restoran")
@CrossOrigin(origins = "*")
public class RestoranController {

    private final KategorijaRepository kategorijaRepository;
    private final JeloRepository jeloRepository;
    private final KorisnikRepository korisnikRepository;
    private final NarudzbaRepository narudzbaRepository;
    private final StavkaNarudzbeRepository stavkaNarudzbeRepository;
    private final KlijentRepository klijentRepository;

    public RestoranController(KategorijaRepository kategorijaRepository,
                              JeloRepository jeloRepository,
                              KorisnikRepository korisnikRepository,
                              NarudzbaRepository narudzbaRepository,
                              StavkaNarudzbeRepository stavkaNarudzbeRepository,
                              KlijentRepository klijentRepository) {
        this.kategorijaRepository = kategorijaRepository;
        this.jeloRepository = jeloRepository;
        this.korisnikRepository = korisnikRepository;
        this.narudzbaRepository = narudzbaRepository;
        this.stavkaNarudzbeRepository = stavkaNarudzbeRepository;
        this.klijentRepository = klijentRepository;
    }

    // --- KATEGORIJE ---

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

    // --- JELA ---

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

    @GetMapping("/{restoranId}/statistika")
    @Transactional(readOnly = true)
    public ResponseEntity<RestoranStatistikaDTO> getStatistika(@PathVariable Long restoranId) {
        Long prodane = narudzbaRepository.prebrojProdaneVrecicePoRestoranu(restoranId);
        Long otkazane = narudzbaRepository.prebrojOtkazaneNarudzbePoRestoranu(restoranId);
        BigDecimal kg = narudzbaRepository.kgSpaseneHranePoRestoranu(restoranId);

        RestoranStatistikaDTO dto = new RestoranStatistikaDTO();
        dto.setBrojProdanihVrecica(prodane != null ? prodane : 0L);
        dto.setBrojOtkazanihNarudzbi(otkazane != null ? otkazane : 0L);
        dto.setKgSpaseneHrane(kg != null ? kg : BigDecimal.ZERO);
        return ResponseEntity.ok(dto);
    }

    // --- NARUDŽBE ---

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

    @PutMapping("/narudzba/{narudzbaId}/status")
    public ResponseEntity<?> promijeniStatusNarudzbe(@PathVariable Long narudzbaId, @RequestBody String noviStatus) {
        NarudzbaEntity narudzba = narudzbaRepository.findById(narudzbaId)
                .orElseThrow(() -> new RuntimeException("Narudžba nije pronađena pod ID: " + narudzbaId));

        String cistiStatus = noviStatus.replace("\"", "").trim();
        narudzba.setStatus(cistiStatus);

        narudzbaRepository.save(narudzba);

        return ResponseEntity.ok("Status uspešno izmenjen!");
    }

    // --- PROFIL RESTORANA ---

    @GetMapping("/{restoranId}/profil")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getProfilRestorana(@PathVariable Long restoranId) {
        return klijentRepository.findById(restoranId)
                .map(klijent -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("id", klijent.getId());
                    response.put("nazivObjekta", klijent.getNazivObjekta());
                    response.put("adresa", klijent.getAdresa());
                    response.put("lat", klijent.getLat());
                    response.put("lng", klijent.getLng());
                    response.put("radnoVrijemeOd", klijent.getRadnoVrijemeOd());
                    response.put("radnoVrijemeDo", klijent.getRadnoVrijemeDo());
                    return ResponseEntity.ok((Object) response);
                })
                .orElseGet(() -> ResponseEntity.badRequest().body((Object) "Restoran nije pronađen!"));
    }

    @PutMapping("/{restoranId}/profil")
    @Transactional
    public ResponseEntity<?> azurirajProfilRestorana(@PathVariable Long restoranId,
                                                     @RequestBody Map<String, Object> body) {
        return klijentRepository.findById(restoranId)
                .map(klijent -> {
                    if (body.containsKey("nazivObjekta") && body.get("nazivObjekta") != null) {
                        String noviNaziv = body.get("nazivObjekta").toString().trim();
                        if (!noviNaziv.isEmpty()) {
                            klijent.setNazivObjekta(noviNaziv);
                        }
                    }

                    if (body.containsKey("adresa") && body.get("adresa") != null) {
                        klijent.setAdresa(body.get("adresa").toString().trim());
                    }
                    if (body.containsKey("lat") && body.get("lat") != null) {
                        klijent.setLat(((Number) body.get("lat")).doubleValue());
                    }
                    if (body.containsKey("lng") && body.get("lng") != null) {
                        klijent.setLng(((Number) body.get("lng")).doubleValue());
                    }
                    if (body.containsKey("radnoVrijemeOd")) {
                        Object v = body.get("radnoVrijemeOd");
                        String s = v != null ? v.toString().trim() : "";
                        klijent.setRadnoVrijemeOd(s.isEmpty() ? null : s);
                    }
                    if (body.containsKey("radnoVrijemeDo")) {
                        Object v = body.get("radnoVrijemeDo");
                        String s = v != null ? v.toString().trim() : "";
                        klijent.setRadnoVrijemeDo(s.isEmpty() ? null : s);
                    }

                    KlijentEntity sacuvani = klijentRepository.save(klijent);

                    Map<String, Object> response = new HashMap<>();
                    response.put("id", sacuvani.getId());
                    response.put("nazivObjekta", sacuvani.getNazivObjekta());
                    response.put("adresa", sacuvani.getAdresa());
                    response.put("lat", sacuvani.getLat());
                    response.put("lng", sacuvani.getLng());
                    response.put("radnoVrijemeOd", sacuvani.getRadnoVrijemeOd());
                    response.put("radnoVrijemeDo", sacuvani.getRadnoVrijemeDo());

                    return ResponseEntity.ok((Object) response);
                })
                .orElseGet(() -> ResponseEntity.badRequest().body((Object) "Restoran nije pronađen!"));
    }

    @PutMapping("/{restoranId}/naziv")
    @Transactional
    public ResponseEntity<?> promijeniNazivObjekta(@PathVariable Long restoranId,
                                                   @RequestBody String noviNaziv) {
        String cistiNaziv = noviNaziv.replace("\"", "").trim();

        if (cistiNaziv.isEmpty()) {
            return ResponseEntity.badRequest().body("Naziv objekta ne može biti prazan!");
        }

        Optional<KlijentEntity> klijentOpt = klijentRepository.findById(restoranId);

        if (klijentOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Klijent nije pronađen!");
        }

        KlijentEntity klijent = klijentOpt.get();
        klijent.setNazivObjekta(cistiNaziv);
        klijentRepository.save(klijent);

        return ResponseEntity.ok("Naziv uspješno promijenjen u: " + cistiNaziv);
    }
}