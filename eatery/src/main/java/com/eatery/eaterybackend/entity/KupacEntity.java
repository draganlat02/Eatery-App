package com.eatery.eaterybackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "kupac")
@PrimaryKeyJoinColumn(name = "id_korisnika")
@Getter
@Setter
public class KupacEntity extends KorisnikEntity {

    @Column(name = "ime", length = 100, nullable = false)
    private String ime;

    @Column(name = "popust")
    private Integer popust = 0;

    @Column(name = "suspendovan")
    private Boolean suspendovan = false;

    @Column(name = "cesti_kupac")
    private Boolean cestiKupac = false;
}