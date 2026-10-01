package com.eatery.eaterybackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.eatery.eaterybackend.entity.OpisEntity;

@Repository
public interface OpisRepository extends JpaRepository<OpisEntity, Long> {
}
