package com.eatery.eaterybackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "kategorija")
@Getter
@Setter
public class KategorijaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_kategorije")
    private Long id;

    @Column(nullable = false)
    private String naziv;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_korisnika", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "sifra"})
    @com.fasterxml.jackson.annotation.JsonIgnore
    private KorisnikEntity restoran;
}