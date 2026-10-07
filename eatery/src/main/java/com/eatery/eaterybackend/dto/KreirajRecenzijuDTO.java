package com.eatery.eaterybackend.dto;

public class KreirajRecenzijuDTO {
    private Long idNarudzbe;
    private Integer ocjena; // 1 - 5
    private String komentar;

    public Long getIdNarudzbe() { return idNarudzbe; }
    public void setIdNarudzbe(Long idNarudzbe) { this.idNarudzbe = idNarudzbe; }

    public Integer getOcjena() { return ocjena; }
    public void setOcjena(Integer ocjena) { this.ocjena = ocjena; }

    public String getKomentar() { return komentar; }
    public void setKomentar(String komentar) { this.komentar = komentar; }
}