package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.NarudzbaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NarudzbaRepository extends JpaRepository<NarudzbaEntity, Long> {

    // Pošto je polje 'kupac', Spring spaja sa kupac.id
    List<NarudzbaEntity> findByKupacId(Long kupacId);

    // Pošto je polje 'restoran', Spring spaja sa restoran.id
    List<NarudzbaEntity> findByRestoranId(Long restoranId);
}