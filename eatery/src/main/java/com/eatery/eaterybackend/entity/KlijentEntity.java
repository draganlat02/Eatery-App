package com.eatery.eaterybackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "klijent")
@PrimaryKeyJoinColumn(name = "id_korisnika")
@Getter
@Setter
public class KlijentEntity extends KorisnikEntity {

    @Column(name = "naziv_objekta", nullable = false)
    private String nazivObjekta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_opisa")
    private OpisEntity opis;
}