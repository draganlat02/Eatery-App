package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.ZahtjevZaPromjenuSifreEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ZahtjevZaPromjenuSifreRepository extends JpaRepository<ZahtjevZaPromjenuSifreEntity, Long> {
    Optional<ZahtjevZaPromjenuSifreEntity> findByKorisnikId(Long korisnikId);
}
