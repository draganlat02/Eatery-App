package com.eatery.eaterybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminOglasDTO {
    private Long id;
    private String naziv;
    private String opis;
    private BigDecimal originalnaCijena;
    private BigDecimal akcijskaCijena;
    private Integer kolicina;
    private Boolean aktivna;
    private Long restoranId;
    private String restoran;
    private String vrijemePreuzimanjaOd;
    private String vrijemePreuzimanjaDo;
    private LocalDateTime vrijemeKreiranja;
}
