package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.StavkaNarudzbeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StavkaNarudzbeRepository extends JpaRepository<StavkaNarudzbeEntity, Long> {

    // Spring JPA sam prepoznaje polje idNarudzbe iz entiteta
    List<StavkaNarudzbeEntity> findByIdNarudzbe(Long idNarudzbe);
}