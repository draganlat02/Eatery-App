package com.eatery.eaterybackend.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.eatery.eaterybackend.entity.NarudzbaEntity;

@Repository
public interface NarudzbaRepository extends JpaRepository<NarudzbaEntity, Long> {

    @EntityGraph(attributePaths = "stavke")
    List<NarudzbaEntity> findByKupacId(Long kupacId);

    @EntityGraph(attributePaths = "stavke")
    List<NarudzbaEntity> findByRestoranId(Long restoranId);

    List<NarudzbaEntity> findByKupacIdOrderByIdDesc(Long kupacId);

    List<NarudzbaEntity> findByRestoranIdOrderByIdDesc(Long restoranId);

    @EntityGraph(attributePaths = "stavke")
    @Query("SELECT n FROM NarudzbaEntity n WHERE n.restoran.id = :restoranId ORDER BY n.id DESC")
    List<NarudzbaEntity> findByRestoranIdWithStavke(@Param("restoranId") Long restoranId);

    @EntityGraph(attributePaths = "stavke")
    @Query("SELECT n FROM NarudzbaEntity n WHERE n.kupac.id = :kupacId ORDER BY n.id DESC")
    List<NarudzbaEntity> findByKupacIdWithStavke(@Param("kupacId") Long kupacId);

    @Query("SELECT n FROM NarudzbaEntity n " +
            "WHERE (n.obavijestPreuzimanjaPoslana IS NULL OR n.obavijestPreuzimanjaPoslana = false) " +
            "AND n.preuzimanjeOd IS NOT NULL AND n.preuzimanjeDo IS NOT NULL " +
            "AND n.preuzimanjeOd <= :sada AND n.preuzimanjeDo > :sada")
    List<NarudzbaEntity> findZaObavijestPreuzimanja(@Param("sada") java.time.LocalDateTime sada);

    @Query(value = "SELECT COALESCE(SUM(sn.kolicina), 0) " +
            "FROM stavka_narudzbe sn " +
            "JOIN narudzba n ON n.id_narudzbe = sn.id_narudzbe " +
            "WHERE n.id_kupca = :kupacId " +
            "AND UPPER(COALESCE(sn.tip_stavke, '')) = 'VRECICA' " +
            "AND UPPER(n.status) IN ('DOSTAVLJENO', 'ZAVRSENO', 'ZAVRŠENO', 'ISPORUCENO', 'PREUZETO')",
            nativeQuery = true)
    Long prebrojVrecicePoKupcu(@Param("kupacId") Long kupacId);

    @Query("SELECT COUNT(n) FROM NarudzbaEntity n WHERE n.restoran.id = :restoranId")
    long brojNarudzbiRestorana(@Param("restoranId") Long restoranId);

    /**
     * Ukupna ušteda kupca: vrećice + jela s popustom.
     * Nove stavke: originalna_cijena - cijena.
     * Stare vrećice bez snapshot-a: fallback na vrecica_iznenadjenja.
     */
    @Query(value = """
            SELECT COALESCE(SUM(usteda), 0) FROM (
                SELECT (COALESCE(sn.originalna_cijena, 0) - COALESCE(sn.cijena, 0)) * sn.kolicina AS usteda
                FROM stavka_narudzbe sn
                JOIN narudzba n ON n.id_narudzbe = sn.id_narudzbe
                WHERE n.id_kupca = :kupacId
                  AND UPPER(n.status) IN ('DOSTAVLJENO', 'ZAVRSENO', 'ZAVRŠENO', 'ISPORUCENO', 'PREUZETO')
                  AND sn.originalna_cijena IS NOT NULL
                  AND COALESCE(sn.originalna_cijena, 0) > COALESCE(sn.cijena, 0)

                UNION ALL

                SELECT (COALESCE(vi.originalna_cijena, 0) - COALESCE(vi.akcijska_cijena, 0)) * sn.kolicina AS usteda
                FROM stavka_narudzbe sn
                JOIN narudzba n ON n.id_narudzbe = sn.id_narudzbe
                JOIN vrecica_iznenadjenja vi ON sn.id_jela = vi.id_vrecice
                WHERE n.id_kupca = :kupacId
                  AND UPPER(COALESCE(sn.tip_stavke, '')) = 'VRECICA'
                  AND sn.originalna_cijena IS NULL
                  AND UPPER(n.status) IN ('DOSTAVLJENO', 'ZAVRSENO', 'ZAVRŠENO', 'ISPORUCENO', 'PREUZETO')
            ) t
            """, nativeQuery = true)
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
