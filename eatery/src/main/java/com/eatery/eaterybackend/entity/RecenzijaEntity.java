package com.eatery.eaterybackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "recenzija")
@Getter
@Setter
public class RecenzijaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_recenzije")
    private Long id;

    @Column(name = "ocjena", nullable = false)
    private Integer ocjena; // 1 - 5

    @Column(name = "komentar", length = 1000)
    private String komentar;

    @Column(name = "datum_kreiranja", nullable = false)
    private LocalDateTime datumKreiranja;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_kupca", referencedColumnName = "id_korisnika", nullable = false)
    private KorisnikEntity kupac;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_restorana", referencedColumnName = "id_korisnika", nullable = false)
    private KorisnikEntity restoran;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_narudzbe", referencedColumnName = "id_narudzbe", nullable = false, unique = true)
    private NarudzbaEntity narudzba;
}