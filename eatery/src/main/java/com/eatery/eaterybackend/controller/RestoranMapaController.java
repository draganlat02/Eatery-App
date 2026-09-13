package com.eatery.eaterybackend.controller;

import com.eatery.eaterybackend.dto.RestoranMapaDTO;
import com.eatery.eaterybackend.dto.UpdateKlijentProfilDTO;
import com.eatery.eaterybackend.entity.KlijentEntity;
import com.eatery.eaterybackend.repository.KlijentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/restorani")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class RestoranMapaController {

    private final KlijentRepository klijentRepository;
    @PutMapping("/{restoranId}/lokacija")
    public ResponseEntity<?> azurirajLokacijuRestorana(
            @PathVariable Long restoranId,
            @RequestBody UpdateKlijentProfilDTO dto) {

        String adresa = dto.getAdresa();
        if (adresa == null || adresa.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Adresa ne smije biti prazna.");
        }

        Double lat = null;
        Double lng = null;

        // 1. Ako koordinate nisu proslijeđene, tražimo ih preko Nominatim geokodera
        if (dto.getLat() != null && dto.getLng() != null) {
            lat = dto.getLat();
            lng = dto.getLng();
        } else {
            try {
                RestTemplate restTemplate = new RestTemplate();
                String url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ba&q="
                        + URLEncoder.encode(adresa.trim(), StandardCharsets.UTF_8);

                HttpHeaders headers = new HttpHeaders();
                headers.set("User-Agent", "EateryApp/1.0 (kontakt@eatery.ba)");

                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);

                if (response.getBody() != null && !response.getBody().isEmpty()) {
                    Map<String, Object> prvaLokacija = (Map<String, Object>) response.getBody().get(0);
                    lat = Double.parseDouble(prvaLokacija.get("lat").toString());
                    lng = Double.parseDouble(prvaLokacija.get("lon").toString());
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Greška pri komunikaciji sa servisom za mape.");
            }
        }

        // 2. STRIKTNA PROVJERA: Ako Nominatim nije pronašao adresu na mapi, prekidamo i vraćamo grešku
        if (lat == null || lng == null) {
            return ResponseEntity.badRequest()
                    .body("Unesena adresa nije pronađena na mapi. Molimo unesite tačnu adresu.");
        }

        // 3. Upis u bazu samo ako je adresa validna
        int count = klijentRepository.postojiKlijent(restoranId);

        if (count > 0) {
            klijentRepository.azurirajKlijenta(restoranId, adresa.trim(), lat, lng);
        } else {
            klijentRepository.ubaciKlijenta(restoranId, adresa.trim(), lat, lng);
        }

        return ResponseEntity.ok(Map.of(
                "poruka", "Lokacija uspješno sačuvana.",
                "adresa", adresa.trim(),
                "lat", lat,
                "lng", lng
        ));
    }
    @GetMapping("/{restoranId}/lokacija")
    public ResponseEntity<?> getLokacijaRestorana(@PathVariable Long restoranId) {
        // Ako ne postoji klijent ili nema lokaciju, vraćamo prazne podatke umjesto greške 400
        KlijentEntity klijent = klijentRepository.findById(restoranId).orElse(null);

        if (klijent == null) {
            return ResponseEntity.ok(Map.of(
                    "adresa", "",
                    "lat", 0.0,
                    "lng", 0.0
            ));
        }

        return ResponseEntity.ok(Map.of(
                "adresa", klijent.getAdresa() != null ? klijent.getAdresa() : "",
                "lat", klijent.getLat() != null ? klijent.getLat() : 0.0,
                "lng", klijent.getLng() != null ? klijent.getLng() : 0.0
        ));
    }
    @GetMapping("/u-blizini")
    public ResponseEntity<List<RestoranMapaDTO>> getRestoraniUBlizini(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5.0") double radijusKm) {

        List<KlijentEntity> sviKlijenti = klijentRepository.findAll();
        List<RestoranMapaDTO> rezultat = new ArrayList<>();

        for (KlijentEntity r : sviKlijenti) {
            if (Boolean.TRUE.equals(r.getAktiviran()) && r.getLat() != null && r.getLng() != null) {
                double dist = izracunajUdaljenostKm(lat, lng, r.getLat(), r.getLng());
                if (dist <= radijusKm) {
                    rezultat.add(new RestoranMapaDTO(
                            r.getId(),
                            r.getNazivObjekta(),
                            r.getAdresa(),
                            r.getLat(),
                            r.getLng(),
                            Math.round(dist * 10.0) / 10.0
                    ));
                }
            }
        }
        return ResponseEntity.ok(rezultat);
    }

    private double izracunajUdaljenostKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}