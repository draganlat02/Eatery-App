package com.eatery.eaterybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestoranMapaDTO {
    private Long id;
    private String naziv;
    private String adresa;
    private Double lat;
    private Double lng;
    private Double udaljenostKm;
    private String radnoVrijemeOd;
    private String radnoVrijemeDo;
}