package com.eatery.eaterybackend.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class NarudzbaDTO {
    private Long kupacId;
    private Long restoranId;
    private String adresaDostave;
    private BigDecimal ukupnaCijena;
    private List<StavkaDTO> stavke;

    @Getter
    @Setter
    public static class StavkaDTO {
        private Long jeloId;
        private String tipStavke; // "JELO" ili "VRECICA"
        private Integer kolicina;
        private BigDecimal cijena;

        public Long getJeloId() { return jeloId; }
        public void setJeloId(Long jeloId) { this.jeloId = jeloId; }

        public String getTipStavke() { return tipStavke; }
        public void setTipStavke(String tipStavke) { this.tipStavke = tipStavke; }

        public Integer getKolicina() { return kolicina; }
        public void setKolicina(Integer kolicina) { this.kolicina = kolicina; }

        public BigDecimal getCijena() { return cijena; }
        public void setCijena(BigDecimal cijena) { this.cijena = cijena; }
    }
}