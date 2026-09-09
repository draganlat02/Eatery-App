package com.eatery.eaterybackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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

    // --- DODATA RELACIJA KA STAVKAMA ---
    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "id_narudzbe") // Strani ključ u tabeli stavka_narudzbe koja pokazuje na narudžbu
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

    @PrePersist
    protected void onCreate() {
        if (this.sifra == null || this.sifra.isEmpty()) {
            this.sifra = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        if (this.status == null) {
            this.status = "KREIRANA";
        }
    }
}