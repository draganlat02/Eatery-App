package com.eatery.eaterybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminZahtjevDTO {
    private Long id;
    private Long korisnikId;
    private String korisnickoIme;
    private String email;
    private String uloga;
    private String prikazIme;
    private LocalDateTime datumPodnosenja;
    private Boolean suspendovan;
    private LocalDateTime suspendovanDo;
}
