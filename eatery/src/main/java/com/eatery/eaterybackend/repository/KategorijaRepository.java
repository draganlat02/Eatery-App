package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.KategorijaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KategorijaRepository extends JpaRepository<KategorijaEntity, Long> {
    List<KategorijaEntity> findByRestoranId(Long restoranId);
}