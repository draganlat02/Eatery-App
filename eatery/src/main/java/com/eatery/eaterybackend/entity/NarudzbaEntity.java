package com.eatery.eaterybackend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "narudzba", schema = "eatery_db")
@Getter
@Setter
public class NarudzbaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_narudzbe")
    private Long id;

    @Column(name = "sifra", nullable = false, length = 45)
    private String sifra;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_kupca", referencedColumnName = "id_korisnika", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "sifra", "lozinka"})
    private KorisnikEntity kupac;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_restorana", referencedColumnName = "id_korisnika", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "sifra", "lozinka"})
    private KorisnikEntity restoran;

    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "id_narudzbe")
    private List<StavkaNarudzbeEntity> stavke = new ArrayList<>();

    @Column(name = "id_ponude", nullable = true)
    private Integer idPonude;

    @Column(name = "id_klijenta", nullable = true)
    private Integer idKlijenta;

    @Column(name = "ukupna_cijena")
    private BigDecimal ukupnaCijena;

    @Column(name = "status")
    private String status = "KREIRANA";

    @Column(name = "adresa_dostave")
    private String adresaDostave;

    @Column(name = "vrijeme_i_datum", insertable = false, updatable = false)
    private LocalDateTime vrijemeIDatum;

    @Column(name = "pin", length = 4)
    private String pin;

    @PrePersist
    protected void onCreate() {

        if (this.sifra == null || this.sifra.isEmpty()) {

            this.sifra = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        if (this.status == null) {

            this.status = "KREIRANA";
        }

        if (this.pin == null || this.pin.isEmpty()) {
            
            this.pin = String.format("%04d", new Random().nextInt(10000));
        }
    }
}
