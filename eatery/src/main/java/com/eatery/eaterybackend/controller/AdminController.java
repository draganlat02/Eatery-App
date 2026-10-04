package com.eatery.eaterybackend.controller;

import com.eatery.eaterybackend.dto.AdminKorisnikDTO;
import com.eatery.eaterybackend.dto.AdminOglasDTO;
import com.eatery.eaterybackend.dto.AdminSuspenzijaDTO;
import com.eatery.eaterybackend.dto.AdminZahtjevDTO;
import com.eatery.eaterybackend.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/zahtjevi")
    public ResponseEntity<List<AdminZahtjevDTO>> getSveZahtjeve(Authentication authentication) {
        adminService.requireAdmin(authentication);
        return ResponseEntity.ok(adminService.getSveZahtjeve());
    }

    @PostMapping("/zahtjevi/{id}/obradi")
    public ResponseEntity<String> obradiZahtjev(@PathVariable Long id,
                                                @RequestParam boolean odobreno,
                                                Authentication authentication) {
        adminService.requireAdmin(authentication);
        return ResponseEntity.ok(adminService.obradiZahtjev(id, odobreno));
    }

    @GetMapping("/kupci")
    public ResponseEntity<List<AdminKorisnikDTO>> getKupce(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean aktiviran,
            @RequestParam(required = false, defaultValue = "id") String sort,
            @RequestParam(required = false, defaultValue = "asc") String dir,
            Authentication authentication) {
        adminService.requireAdmin(authentication);
        return ResponseEntity.ok(adminService.getKupce(q, aktiviran, sort, dir));
    }

    @GetMapping("/klijenti")
    public ResponseEntity<List<AdminKorisnikDTO>> getKlijente(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean aktiviran,
            @RequestParam(required = false, defaultValue = "id") String sort,
            @RequestParam(required = false, defaultValue = "asc") String dir,
            Authentication authentication) {
        adminService.requireAdmin(authentication);
        return ResponseEntity.ok(adminService.getKlijente(q, aktiviran, sort, dir));
    }

    @PostMapping("/korisnici/{id}/aktiviraj")
    public ResponseEntity<String> aktivirajKorisnika(@PathVariable Long id, Authentication authentication) {
        adminService.requireAdmin(authentication);
        return ResponseEntity.ok(adminService.aktivirajKorisnika(id));
    }

    @PostMapping("/korisnici/{id}/suspenduj")
    public ResponseEntity<String> suspendujKorisnika(@PathVariable Long id,
                                                     @RequestBody AdminSuspenzijaDTO dto,
                                                     Authentication authentication) {
        adminService.requireAdmin(authentication);
        return ResponseEntity.ok(adminService.suspendujKorisnika(id, dto, authentication));
    }

    @PostMapping("/korisnici/{id}/skini-suspenziju")
    public ResponseEntity<String> skiniSuspenziju(@PathVariable Long id, Authentication authentication) {
        adminService.requireAdmin(authentication);
        return ResponseEntity.ok(adminService.skiniSuspenziju(id, authentication));
    }

    @GetMapping("/oglasi")
    public ResponseEntity<List<AdminOglasDTO>> getOglase(Authentication authentication) {
        adminService.requireAdmin(authentication);
        return ResponseEntity.ok(adminService.getOglase());
    }

    @DeleteMapping("/oglasi/{id}")
    public ResponseEntity<String> obrisiOglas(@PathVariable Long id, Authentication authentication) {
        adminService.requireAdmin(authentication);
        return ResponseEntity.ok(adminService.obrisiOglas(id));
    }
}
