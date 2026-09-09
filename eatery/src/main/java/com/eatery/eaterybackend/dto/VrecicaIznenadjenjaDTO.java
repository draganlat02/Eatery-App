package com.eatery.eaterybackend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class VrecicaIznenadjenjaDTO {
    private String naziv;
    private String opis;
    private BigDecimal originalnaCijena;
    private BigDecimal akcijskaCijena;
    private Integer kolicina;
    private String vrijemePreuzimanjaOd;
    private String vrijemePreuzimanjaDo;
    private Boolean aktivna;
}