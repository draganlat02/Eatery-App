package com.eatery.eaterybackend.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
public class JeloDTO {
    private String naziv;
    private String opis;
    private BigDecimal cijena;
    private Long kategorijaId;
}
