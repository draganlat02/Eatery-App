package com.eatery.eaterybackend.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eatery.eaterybackend.dto.KreirajNarudzbuDTO;
import com.eatery.eaterybackend.dto.KupacProfilDTO;
import com.eatery.eaterybackend.dto.MojeNarudzbeDTO;
import com.eatery.eaterybackend.dto.StavkaNarudzbeDTO;
import com.eatery.eaterybackend.dto.UpdateKupacProfilDTO;
import com.eatery.eaterybackend.entity.JeloEntity;
import com.eatery.eaterybackend.entity.KlijentEntity;
import com.eatery.eaterybackend.entity.KorisnikEntity;
import com.eatery.eaterybackend.entity.KupacEntity;
import com.eatery.eaterybackend.entity.NarudzbaEntity;
import com.eatery.eaterybackend.entity.StavkaNarudzbeEntity;
import com.eatery.eaterybackend.repository.JeloRepository;
import com.eatery.eaterybackend.repository.KlijentRepository;
import com.eatery.eaterybackend.repository.KorisnikRepository;
import com.eatery.eaterybackend.repository.KupacRepository;
import com.eatery.eaterybackend.repository.NarudzbaRepository;
import com.eatery.eaterybackend.repository.StavkaNarudzbeRepository;

@RestController
@RequestMapping("/api/kupac")
@CrossOrigin(origins = "*")
public class KupacController {

    private final KorisnikRepository korisnikRepository;
    private final KupacRepository kupacRepository;
    private final KlijentRepository klijentRepository;
    private final JeloRepository jeloRepository;
    private final NarudzbaRepository narudzbaRepository;
    private final StavkaNarudzbeRepository stavkaNarudzbeRepository;

    public KupacController(KorisnikRepository korisnikRepository,
                           KupacRepository kupacRepository,
                           KlijentRepository klijentRepository,
                           JeloRepository jeloRepository,
                           NarudzbaRepository narudzbaRepository,
                           StavkaNarudzbeRepository stavkaNarudzbeRepository) {
                            
        this.korisnikRepository = korisnikRepository;
        this.kupacRepository = kupacRepository;
        this.klijentRepository = klijentRepository;
        this.jeloRepository = jeloRepository;
        this.narudzbaRepository = narudzbaRepository;
        this.stavkaNarudzbeRepository = stavkaNarudzbeRepository;
    }

    private boolean isKorisnikOvlascen(Long trazeniKorisnikId, Authentication authentication) {
        
        if (authentication == null) return false;

        String ulogovaniUsername = authentication.getName();
        KorisnikEntity ulogovani = korisnikRepository.findByKorisnickoIme(ulogovaniUsername).orElse(null);
        
        return ulogovani != null && ulogovani.getId().equals(trazeniKorisnikId);
    }

    @GetMapping("/profil/{kupacId}")
    public ResponseEntity<?> getProfilKupca(@PathVariable Long kupacId, Authentication authentication) {
        
        if (!isKorisnikOvlascen(kupacId, authentication)) {
            
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Nemate dozvolu za pristup ovom profilu!");
        }

        KorisnikEntity korisnik = korisnikRepository.findById(kupacId)
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen sa ID: " + kupacId));

        if (korisnik.getUloga() == null || !"KUPAC".equalsIgnoreCase(korisnik.getUloga())) {
            
            return ResponseEntity.status(400).body("Korisnik sa ID " + kupacId + " nije kupac.");
        }

        KupacEntity kupac = kupacRepository.findById(kupacId).orElse(null);

        Long ukupnoVrecica = narudzbaRepository.prebrojVrecicePoKupcu(kupacId);
        BigDecimal ukupnaUsteda = narudzbaRepository.izracunajUsteduPoKupcu(kupacId);

        KupacProfilDTO dto = new KupacProfilDTO();
        dto.setIdKorisnika(korisnik.getId());
        dto.setEmail(korisnik.getEmail());
        dto.setKorisnickoIme(korisnik.getKorisnickoIme());

        if (kupac != null) {

            dto.setIme(kupac.getIme());
            dto.setCestiKupac(kupac.getCestiKupac());
            dto.setPopust(kupac.getPopust());
        }

        dto.setUkupnoVrecica(ukupnoVrecica != null ? ukupnoVrecica : 0L);
        dto.setUkupnaUstedaKM(ukupnaUsteda != null ? ukupnaUsteda : BigDecimal.ZERO);

        return ResponseEntity.ok(dto);
    }

    @PutMapping("/profil/{kupacId}")
    public ResponseEntity<?> updateProfilKupca(
            @PathVariable Long kupacId,
            @RequestBody UpdateKupacProfilDTO dto,
            Authentication authentication
    ) {

        if (!isKorisnikOvlascen(kupacId, authentication)) {
            
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Nemate dozvolu da menjate ovaj profil!"));
        }

        KorisnikEntity korisnik = korisnikRepository.findById(kupacId)
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen sa ID: " + kupacId));

        if (korisnik.getUloga() == null || !"KUPAC".equalsIgnoreCase(korisnik.getUloga())) {
           
            return ResponseEntity.status(400).body(Map.of("message", "Korisnik nije kupac."));
        }

        KupacEntity kupac = kupacRepository.findById(kupacId).orElse(null);
        if (kupac == null) {
            
            return ResponseEntity.status(400).body(Map.of("message", "Profil kupca nije pronađen."));
        }

        String novoIme = dto.getIme() != null ? dto.getIme().trim() : "";
        String noviEmail = dto.getEmail() != null ? dto.getEmail().trim() : "";
        String novoKorisnickoIme = dto.getKorisnickoIme() != null ? dto.getKorisnickoIme().trim() : "";

        if (novoIme.isEmpty() || noviEmail.isEmpty() || novoKorisnickoIme.isEmpty()) {
            
            return ResponseEntity.status(400).body(Map.of("message", "Ime, email i korisničko ime su obavezni."));
        }

        if (!noviEmail.equalsIgnoreCase(kupac.getEmail()) && korisnikRepository.existsByEmail(noviEmail)) {
           
            return ResponseEntity.status(400).body(Map.of("message", "Email je već zauzet."));
        }

        if (!novoKorisnickoIme.equalsIgnoreCase(kupac.getKorisnickoIme())
                && korisnikRepository.existsByKorisnickoIme(novoKorisnickoIme)) {

            return ResponseEntity.status(400).body(Map.of("message", "Korisničko ime je već zauzeto."));
        }

        kupac.setIme(novoIme);
        kupac.setEmail(noviEmail);
        kupac.setKorisnickoIme(novoKorisnickoIme);
        kupacRepository.save(kupac);

        return getProfilKupca(kupacId, authentication);
    }

    @GetMapping("/restorani")
    public ResponseEntity<List<KlijentEntity>> getAktivniRestorani() {

        return ResponseEntity.ok(klijentRepository.findAll().stream()
                .filter(k -> Boolean.TRUE.equals(k.getAktiviran()))
                .toList());
    }

    @PostMapping("/narudzba")
    @Transactional
    public ResponseEntity<?> kreirajNarudzbu(@RequestBody KreirajNarudzbuDTO dto, Authentication authentication) {
       
        if (authentication == null) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Niste autentifikovani!");
        }

        String ulogovaniUsername = authentication.getName();
        KorisnikEntity ulogovaniKupac = korisnikRepository.findByKorisnickoIme(ulogovaniUsername)
                .orElseThrow(() -> new RuntimeException("Ulogovani kupac nije pronađen!"));

        KorisnikEntity restoran = korisnikRepository.findById(dto.getRestoranId())
                .orElseThrow(() -> new RuntimeException("Restoran nije pronađen sa ID: " + dto.getRestoranId()));

        NarudzbaEntity narudzba = new NarudzbaEntity();
        narudzba.setKupac(ulogovaniKupac);
        narudzba.setRestoran(restoran);
        narudzba.setAdresaDostave(dto.getAdresaDostave());
        narudzba.setUkupnaCijena(BigDecimal.ZERO);

        NarudzbaEntity sacuvanaNarudzba = narudzbaRepository.save(narudzba);

        BigDecimal ukupno = BigDecimal.ZERO;

        for (StavkaNarudzbeDTO sDTO : dto.getStavke()) {

            JeloEntity jelo = jeloRepository.findById(sDTO.getJeloId())
                    .orElseThrow(() -> new RuntimeException("Jelo nije pronađeno sa ID: " + sDTO.getJeloId()));

            StavkaNarudzbeEntity stavka = new StavkaNarudzbeEntity();
            stavka.setIdNarudzbe(sacuvanaNarudzba.getId());
            stavka.setIdJela(sDTO.getJeloId());
            stavka.setKolicina(sDTO.getKolicina());

            BigDecimal cijenaStavke = jelo.getCijena().multiply(BigDecimal.valueOf(sDTO.getKolicina()));
            stavka.setCijena(cijenaStavke);

            stavkaNarudzbeRepository.save(stavka);
            ukupno = ukupno.add(cijenaStavke);
        }

        sacuvanaNarudzba.setUkupnaCijena(ukupno);
        narudzbaRepository.save(sacuvanaNarudzba);

        return ResponseEntity.ok("Narudžba uspešno poslana!");
    }

    @GetMapping("/restoran/{restoranId}/jela")
    public ResponseEntity<List<JeloEntity>> getJelaZaRestoran(@PathVariable Long restoranId) {
        
        return ResponseEntity.ok(jeloRepository.findAll().stream()
                .filter(j -> j.getRestoran() != null && restoranId.equals(j.getRestoran().getId()))
                .toList());
    }

    @GetMapping("/narudzbe/{kupacId}")
    public ResponseEntity<?> getNarudzbeKupca(@PathVariable Long kupacId, Authentication authentication) {
        
        if (!isKorisnikOvlascen(kupacId, authentication)) {
            
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Nemate dozvolu da gledate narudžbe drugog kupca!");
        }

        List<NarudzbaEntity> narudzbe = narudzbaRepository.findByKupacIdOrderByIdDesc(kupacId);

        List<MojeNarudzbeDTO> result = narudzbe.stream().map(n -> {
            MojeNarudzbeDTO dto = new MojeNarudzbeDTO();
            dto.setId(n.getId());
            dto.setSifra(n.getSifra());
            dto.setStatus(n.getStatus());
            dto.setUkupnaCijena(n.getUkupnaCijena());
            dto.setAdresaDostave(n.getAdresaDostave());
            dto.setVrijemeKreiranja(n.getVrijemeIDatum());
            dto.setPin(n.getPin());

            if (n.getRestoran() != null) {

                dto.setRestoranNaziv(n.getRestoran().getKorisnickoIme());
            }

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
}
