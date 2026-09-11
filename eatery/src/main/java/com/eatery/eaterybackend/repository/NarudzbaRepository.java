package com.eatery.eaterybackend.repository;

import com.eatery.eaterybackend.entity.NarudzbaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface NarudzbaRepository extends JpaRepository<NarudzbaEntity, Long> {

    List<NarudzbaEntity> findByKupacId(Long kupacId);

    List<NarudzbaEntity> findByRestoranId(Long restoranId);

    // 1. Prebrojavanje ukupnog broja vrećica (zbir kolone 'kolicina' u stavkama)
    @Query(value = "SELECT COALESCE(SUM(sn.kolicina), 0) " +
            "FROM stavka_narudzbe sn " +
            "WHERE sn.id_narudzbe IN (" +
            "    SELECT n.id_narudzbe FROM narudzba n " +
            "    WHERE n.id_kupca = :kupacId " +
            "    AND UPPER(n.status) IN ('DOSTAVLJENO', 'ZAVRSENO', 'ZAVRŠENO', 'ISPORUCENO', 'PREUZETO')" +
            ")",
            nativeQuery = true)
    Long prebrojVrecicePoKupcu(@Param("kupacId") Long kupacId);

    // 2. Izračunavanje ukupne uštede u KM za sve preuzete/dostavljene narudžbe
    @Query(value = "SELECT COALESCE(SUM((COALESCE(vi.originalna_cijena, 0) - COALESCE(vi.akcijska_cijena, 0)) * sn.kolicina), 0) " +
            "FROM stavka_narudzbe sn " +
            "JOIN vrecica_iznenadjenja vi ON sn.id_jela = vi.id_vrecice " +
            "WHERE sn.id_narudzbe IN (" +
            "    SELECT n.id_narudzbe FROM narudzba n " +
            "    WHERE n.id_kupca = :kupacId " +
            "    AND UPPER(n.status) IN ('DOSTAVLJENO', 'ZAVRSENO', 'ZAVRŠENO', 'ISPORUCENO', 'PREUZETO')" +
            ")",
            nativeQuery = true)
    BigDecimal izracunajUsteduPoKupcu(@Param("kupacId") Long kupacId);
}