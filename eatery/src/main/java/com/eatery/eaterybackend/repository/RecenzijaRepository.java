package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.RecenzijaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecenzijaRepository extends JpaRepository<RecenzijaEntity, Long> {

    // Dohvati sve recenzije za restoran preko njegovog ID-a
    List<RecenzijaEntity> findByRestoranId(Long idRestorana);

    // Izračunaj prosječnu ocjenu za restoran (r.restoran.id)
    @Query("SELECT COALESCE(AVG(r.ocjena), 0.0) FROM RecenzijaEntity r WHERE r.restoran.id = :idRestorana")
    Double getProsjecnaOcjenaZaRestoran(@Param("idRestorana") Long idRestorana);

    // Vraća ukupan broj ocjena za restoran
    Long countByRestoranId(Long idRestorana);

    // Provjera da li je narudžba već ocjenjena preko njenog ID-a (r.narudzba.id)
    boolean existsByNarudzbaId(Long idNarudzbe);
}