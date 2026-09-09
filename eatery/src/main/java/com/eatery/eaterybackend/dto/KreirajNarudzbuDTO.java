package com.eatery.eaterybackend.dto;

import java.util.List;

public class KreirajNarudzbuDTO {
    private Long kupacId;
    private Long restoranId;
    private String adresaDostave;
    private List<StavkaNarudzbeDTO> stavke;

    // Getteri i Setteri
    public Long getKupacId() { return kupacId; }
    public void setKupacId(Long kupacId) { this.kupacId = kupacId; }

    public Long getRestoranId() { return restoranId; }
    public void setRestoranId(Long restoranId) { this.restoranId = restoranId; }

    public String getAdresaDostave() { return adresaDostave; }
    public void setAdresaDostave(String adresaDostave) { this.adresaDostave = adresaDostave; }

    public List<StavkaNarudzbeDTO> getStavke() { return stavke; }
    public void setStavke(List<StavkaNarudzbeDTO> stavke) { this.stavke = stavke; }
}