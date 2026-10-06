package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.ZahtjevZaAktivacijuEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ZahtjevZaAktivacijuRepository extends JpaRepository<ZahtjevZaAktivacijuEntity, Long> {
    Optional<ZahtjevZaAktivacijuEntity> findByKorisnikId(Long korisnikId);
}
