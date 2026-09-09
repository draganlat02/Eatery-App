package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.KupacEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KupacRepository extends JpaRepository<KupacEntity, Long> {
}