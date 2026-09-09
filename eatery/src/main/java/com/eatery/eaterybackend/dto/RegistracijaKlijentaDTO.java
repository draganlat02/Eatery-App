package com.eatery.eaterybackend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistracijaKlijentaDTO {
    private String korisnickoIme;
    private String sifra;
    private String email;
    private String nazivObjekta;
    private String opis;
}