package com.eatery.eaterybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminKorisnikDTO {
    private Long id;
    private String korisnickoIme;
    private String email;
    private String uloga;
    private Boolean aktiviran;
    private String prikazIme;
    private String adresa;
    private Boolean suspendovan;
    private LocalDateTime suspendovanDo;
}
