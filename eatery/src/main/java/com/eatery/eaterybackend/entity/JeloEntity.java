package com.eatery.eaterybackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "jelo")
@Getter
@Setter
public class JeloEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_jela")
    private Long id;

    @Column(nullable = false)
    private String naziv;

    private String opis;

    @Column(nullable = false)
    private BigDecimal cijena;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_kategorije", nullable = false)
    private KategorijaEntity kategorija;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_korisnika", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "sifra"})
    private KorisnikEntity restoran;
}