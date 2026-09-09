package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.VrecicaIznenadjenjaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VrecicaIznenadjenjaRepository extends JpaRepository<VrecicaIznenadjenjaEntity, Long> {

    // Dohvata sve aktivne vrećice kojih ima na stanju (za Kupce na vrhu app)
    List<VrecicaIznenadjenjaEntity> findByAktivnaTrueAndKolicinaGreaterThan(Integer kolicina);

    // Dohvata sve vrećice za određeni restoran (za Restoranski panel)
    List<VrecicaIznenadjenjaEntity> findByRestoranId(Long restoranId);
}