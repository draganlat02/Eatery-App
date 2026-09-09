package com.eatery.eaterybackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "opis")
@Getter
@Setter
public class OpisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_opisa")
    private Long id;

    @Column(name = "tip", length = 50)
    private String tip;

    @Column(name = "sadrzaj", columnDefinition = "TEXT")
    private String sadrzaj;

    @Column(name = "poslednja_izmjena")
    private LocalDateTime poslednjaIzmjena = LocalDateTime.now();
}