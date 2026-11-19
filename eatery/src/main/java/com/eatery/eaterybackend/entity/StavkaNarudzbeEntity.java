package com.eatery.eaterybackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "stavka_narudzbe", schema = "eatery_db")
@Getter
@Setter
public class StavkaNarudzbeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_stavke")
    private Long id;

    @Column(name = "id_narudzbe")
    private Long idNarudzbe;

    @Column(name = "id_jela")
    private Long idJela;

    @Column(name = "naziv")
    private String naziv;

    @Column(name = "kolicina")
    private Integer kolicina;

    /** Plaćena (efektivna) cijena po komadu u trenutku narudžbe. */
    @Column(name = "cijena")
    private BigDecimal cijena;

    /**
     * Originalna cijena po komadu prije popusta (snapshot u trenutku narudžbe).
     * Koristi se za prikaz uštede i za polje „Ukupna ušteda“ na profilu kupca.
     */
    @Column(name = "originalna_cijena")
    private BigDecimal originalnaCijena;

    @Column(name = "tip_stavke")
    private String tipStavke;
}
