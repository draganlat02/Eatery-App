package com.eatery.eaterybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class KorisnikResponseDTO {
    private Long id;
    private String korisnickoIme;
    private String email;
    private String uloga;
    private Boolean aktiviran;
}