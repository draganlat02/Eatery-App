package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.ZahtjevZaAktivacijuEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ZahtjevZaAktivacijuRepository extends JpaRepository<ZahtjevZaAktivacijuEntity, Long> {
}
