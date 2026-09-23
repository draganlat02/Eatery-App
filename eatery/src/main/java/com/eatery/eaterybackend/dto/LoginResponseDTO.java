package com.eatery.eaterybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDTO {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String korisnickoIme;
    private String uloga;
    private String nazivObjekta;

    // Prilagođeni konstruktor koji zadržava podrazumijevanu vrijednost "Bearer" za 'type'
    public LoginResponseDTO(String token, Long id, String korisnickoIme, String uloga, String nazivObjekta) {
        this.token = token;
        this.id = id;
        this.korisnickoIme = korisnickoIme;
        this.uloga = uloga;
        this.nazivObjekta = nazivObjekta;
    }
}