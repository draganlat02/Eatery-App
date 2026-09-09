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

    // ➕ DODAJTE OVO: Prosto polje za ID jela
    @Column(name = "id_jela")
    private Long idJela;

    @Column(name = "naziv")
    private String naziv;

    @Column(name = "kolicina")
    private Integer kolicina;

    @Column(name = "cijena")
    private BigDecimal cijena;

    @Column(name = "tip_stavke")
    private String tipStavke;
}