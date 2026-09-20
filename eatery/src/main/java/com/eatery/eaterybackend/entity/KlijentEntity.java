package com.eatery.eaterybackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "klijent")
@PrimaryKeyJoinColumn(name = "id_korisnika")
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "sifra", "slika"})
public class KlijentEntity extends KorisnikEntity {

    @Column(name = "naziv_objekta", nullable = false)
    private String nazivObjekta;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_opisa")
    private OpisEntity opis;

    @Column(name = "adresa")
    private String adresa;

    @Column(name = "lat")
    private Double lat;

    @Column(name = "lng")
    private Double lng;

    @Column(name = "radno_vrijeme_od")
    private String radnoVrijemeOd;

    @Column(name = "radno_vrijeme_do")
    private String radnoVrijemeDo;
}