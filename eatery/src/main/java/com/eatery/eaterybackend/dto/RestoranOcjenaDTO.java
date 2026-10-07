package com.eatery.eaterybackend.dto;

public class RestoranOcjenaDTO {
    private Double prosjecnaOcjena;
    private Long ukupanBrojOcjena;

    public RestoranOcjenaDTO(Double prosjecnaOcjena, Long ukupanBrojOcjena) {
        this.prosjecnaOcjena = prosjecnaOcjena;
        this.ukupanBrojOcjena = ukupanBrojOcjena;
    }

    public Double getProsjecnaOcjena() { return prosjecnaOcjena; }
    public void setProsjecnaOcjena(Double prosjecnaOcjena) { this.prosjecnaOcjena = prosjecnaOcjena; }

    public Long getUkupanBrojOcjena() { return ukupanBrojOcjena; }
    public void setUkupanBrojOcjena(Long ukupanBrojOcjena) { this.ukupanBrojOcjena = ukupanBrojOcjena; }
}