package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.KlijentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface KlijentRepository extends JpaRepository<KlijentEntity, Long> {

    // Provjera da li u tabeli klijenti/klijent postoji red za ovog korisnika
    @Query(value = "SELECT COUNT(*) FROM klijent WHERE id_korisnika = :id", nativeQuery = true)
    int postojiKlijent(@Param("id") Long id);

    // Ako ne postoji, ubacujemo direktan red
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO klijent (id_korisnika, adresa, lat, lng, naziv_objekta) VALUES (:id, :adresa, :lat, :lng, 'Restoran')", nativeQuery = true)
    void ubaciKlijenta(@Param("id") Long id, @Param("adresa") String adresa, @Param("lat") Double lat, @Param("lng") Double lng);
    // Ako postoji, radimo direktan update
    @Modifying
    @Transactional
    @Query(value = "UPDATE klijent SET adresa = :adresa, lat = :lat, lng = :lng WHERE id_korisnika = :id", nativeQuery = true)
    void azurirajKlijenta(@Param("id") Long id, @Param("adresa") String adresa, @Param("lat") Double lat, @Param("lng") Double lng);


}