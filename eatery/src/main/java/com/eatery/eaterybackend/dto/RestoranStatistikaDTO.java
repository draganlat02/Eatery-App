package com.eatery.eaterybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RestoranStatistikaDTO {
    private Long brojProdanihVrecica;
    private Long brojOtkazanihNarudzbi;
    private BigDecimal kgSpaseneHrane;
}
