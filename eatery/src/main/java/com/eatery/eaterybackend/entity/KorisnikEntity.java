package com.eatery.eaterybackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "korisnik")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
public class KorisnikEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_korisnika")
    private Long id;

    @Column(name = "korisnicko_ime", nullable = false, unique = true)
    private String korisnickoIme;

    @Column(name = "sifra", nullable = false)
    private String sifra;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "uloga", nullable = false, length = 50)
    private String uloga;

    @Column(name = "aktiviran")
    private Boolean aktiviran = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_slike")
    private SlikaEntity slika;
}