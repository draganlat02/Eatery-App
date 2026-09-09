package com.eatery.eaterybackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ponuda")
@Getter
@Setter
public class PonudaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ponude")
    private Long id;

    @Column(name = "cijena", nullable = false)
    private Double cijena;

    @Column(name = "tip_ponude", nullable = false, length = 50)
    private String tipPonude; // 'JELO' ili 'VRECICA'

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_klijenta", nullable = false)
    private KlijentEntity klijent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_opisa")
    private OpisEntity opis;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_slike")
    private SlikaEntity slika;

    // Specifično za Jelo
    @Column(name = "naziv_jela", length = 100)
    private String nazivJela;

    // Specifično za Vrećicu iznenađenja
    @Column(name = "kategorija", length = 50)
    private String kategorija;
}