package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.JeloEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JeloRepository extends JpaRepository<JeloEntity, Long> {
    List<JeloEntity> findByRestoranId(Long restoranId);
}