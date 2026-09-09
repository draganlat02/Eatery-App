package com.eatery.eaterybackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "zahtjev_za_aktivaciju")
@Getter
@Setter
public class ZahtjevZaAktivacijuEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_zahtjeva")
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_korisnika", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private KorisnikEntity korisnik;

    @Column(name = "vrijeme_kreiranja")
    private LocalDateTime datumPodnosenja = LocalDateTime.now();
}