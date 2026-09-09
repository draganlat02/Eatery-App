package com.eatery.eaterybackend.controller;

import com.eatery.eaterybackend.entity.ZahtjevZaAktivacijuEntity;
import com.eatery.eaterybackend.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*") // <-- Obavezno proverite ovu liniju
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/zahtjevi")
    public ResponseEntity<List<ZahtjevZaAktivacijuEntity>> getSveZahtjeve() {
        return ResponseEntity.ok(adminService.getSveZahtjeve());
    }

    @PostMapping("/zahtjevi/{id}/obradi")
    public ResponseEntity<String> obradiZahtjev(@PathVariable Long id, @RequestParam boolean odobreno) {
        return ResponseEntity.ok(adminService.obradiZahtjev(id, odobreno));
    }
}