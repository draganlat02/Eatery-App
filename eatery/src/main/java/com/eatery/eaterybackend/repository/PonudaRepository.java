package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.PonudaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PonudaRepository extends JpaRepository<PonudaEntity, Long> {
    List<PonudaEntity> findByKlijentId(Long klijentId);
    List<PonudaEntity> findByTipPonude(String tipPonude);
}