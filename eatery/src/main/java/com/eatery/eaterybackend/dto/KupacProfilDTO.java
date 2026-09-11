package com.eatery.eaterybackend.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
public class KupacProfilDTO {
    private Long idKorisnika;
    private String ime;
    private String email;
    private String korisnickoIme;
    private Boolean cestiKupac;
    private Integer popust;
    private Long ukupnoVrecica;
    private BigDecimal ukupnaUstedaKM;

}