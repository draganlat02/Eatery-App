package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.KorisnikEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KorisnikRepository extends JpaRepository<KorisnikEntity, Long> {
    Optional<KorisnikEntity> findByKorisnickoIme(String korisnickoIme);
    Optional<KorisnikEntity> findByEmail(String email);
    boolean existsByKorisnickoIme(String korisnickoIme);
    boolean existsByEmail(String email);
}