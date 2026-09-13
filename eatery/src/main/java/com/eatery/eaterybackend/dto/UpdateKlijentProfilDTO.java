package com.eatery.eaterybackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateKlijentProfilDTO {
    private String adresa;
    private Double lat;
    private Double lng;
}