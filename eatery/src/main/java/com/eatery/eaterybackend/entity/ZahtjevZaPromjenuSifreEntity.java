package com.eatery.eaterybackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(name = "zahtjev_za_promjenu_sifre")
@Getter
@Setter
public class ZahtjevZaPromjenuSifreEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_zahtjeva")
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_korisnika", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private KorisnikEntity korisnik;

    // Nova šifra je već šifrovana (BCrypt) i postaje važeća tek kad admin odobri zahtjev
    @Column(name = "nova_sifra", nullable = false)
    private String novaSifra;

    @Column(name = "datum_podnosenja")
    private LocalDateTime datumPodnosenja = LocalDateTime.now();
}
