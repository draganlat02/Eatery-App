package com.eatery.eaterybackend.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.eatery.eaterybackend.entity.NarudzbaEntity;

@Repository
public interface NarudzbaRepository extends JpaRepository<NarudzbaEntity, Long> {

    List<NarudzbaEntity> findByKupacId(Long kupacId);

    List<NarudzbaEntity> findByRestoranId(Long restoranId);

    List<NarudzbaEntity> findByKupacIdOrderByIdDesc(Long kupacId);

    List<NarudzbaEntity> findByRestoranIdOrderByIdDesc(Long restoranId);

    @Query(value = "SELECT COALESCE(SUM(sn.kolicina), 0) " +
            "FROM stavka_narudzbe sn " +
            "WHERE sn.id_narudzbe IN (" +
            "    SELECT n.id_narudzbe FROM narudzba n " +
            "    WHERE n.id_kupca = :kupacId " +
            "    AND UPPER(n.status) IN ('DOSTAVLJENO', 'ZAVRSENO', 'ZAVRŠENO', 'ISPORUCENO', 'PREUZETO')" +
            ")",
            nativeQuery = true)
    Long prebrojVrecicePoKupcu(@Param("kupacId") Long kupacId);

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

    @Query(value = "SELECT COALESCE(SUM(sn.kolicina), 0) " +
            "FROM stavka_narudzbe sn " +
            "JOIN narudzba n ON n.id_narudzbe = sn.id_narudzbe " +
            "WHERE n.id_restorana = :restoranId " +
            "AND UPPER(COALESCE(sn.tip_stavke, '')) = 'VRECICA' " +
            "AND UPPER(n.status) IN ('DOSTAVLJENO', 'ZAVRSENO', 'ZAVRŠENO', 'ISPORUCENO', 'PREUZETO')",
            nativeQuery = true)
    Long prebrojProdaneVrecicePoRestoranu(@Param("restoranId") Long restoranId);

    @Query(value = "SELECT COUNT(*) FROM narudzba n " +
            "WHERE n.id_restorana = :restoranId " +
            "AND UPPER(n.status) IN ('OTKAZANA', 'OTKAZANO', 'ODBIJENA')",
            nativeQuery = true)
    Long prebrojOtkazaneNarudzbePoRestoranu(@Param("restoranId") Long restoranId);

    @Query(value = "SELECT COALESCE(SUM(COALESCE(vi.tezina_kg, 1) * sn.kolicina), 0) " +
            "FROM stavka_narudzbe sn " +
            "JOIN narudzba n ON n.id_narudzbe = sn.id_narudzbe " +
            "JOIN vrecica_iznenadjenja vi ON vi.id_vrecice = sn.id_jela " +
            "WHERE n.id_restorana = :restoranId " +
            "AND UPPER(COALESCE(sn.tip_stavke, 'VRECICA')) = 'VRECICA' " +
            "AND UPPER(n.status) IN ('DOSTAVLJENO', 'ZAVRSENO', 'ZAVRŠENO', 'ISPORUCENO', 'PREUZETO')",
            nativeQuery = true)
    BigDecimal kgSpaseneHranePoRestoranu(@Param("restoranId") Long restoranId);
}
