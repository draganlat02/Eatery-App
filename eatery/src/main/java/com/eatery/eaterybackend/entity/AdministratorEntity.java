package com.eatery.eaterybackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "administrator")
@PrimaryKeyJoinColumn(name = "id_korisnika")
@Getter
@Setter
public class AdministratorEntity extends KorisnikEntity {
}