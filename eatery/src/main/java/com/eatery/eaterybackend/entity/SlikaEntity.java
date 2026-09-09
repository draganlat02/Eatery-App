package com.eatery.eaterybackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "slika")
@Getter
@Setter
public class SlikaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_slike")
    private Long id;

    @Column(name = "naziv", nullable = false)
    private String naziv;

    @Column(name = "datum_uploadovanja")
    private LocalDateTime datumUploadovanja = LocalDateTime.now();

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "velicina")
    private Long velicina;

    @Lob
    @Column(name = "sadrzaj", columnDefinition = "LONGBLOB")
    private byte[] sadrzaj;
}