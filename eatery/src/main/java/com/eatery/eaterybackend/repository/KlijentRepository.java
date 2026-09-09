package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.KlijentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KlijentRepository extends JpaRepository<KlijentEntity, Long> {
}