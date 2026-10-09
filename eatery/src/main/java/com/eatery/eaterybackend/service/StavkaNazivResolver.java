package com.eatery.eaterybackend.service;

import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.eatery.eaterybackend.entity.JeloEntity;
import com.eatery.eaterybackend.entity.StavkaNarudzbeEntity;
import com.eatery.eaterybackend.entity.VrecicaIznenadjenjaEntity;
import com.eatery.eaterybackend.repository.JeloRepository;
import com.eatery.eaterybackend.repository.VrecicaIznenadjenjaRepository;

@Service
public class StavkaNazivResolver {

    private final JeloRepository jeloRepository;
    private final VrecicaIznenadjenjaRepository vrecicaRepository;

    public StavkaNazivResolver(JeloRepository jeloRepository,
                               VrecicaIznenadjenjaRepository vrecicaRepository) {
        this.jeloRepository = jeloRepository;
        this.vrecicaRepository = vrecicaRepository;
    }

    public KatalogNaziva katalogZa(Collection<StavkaNarudzbeEntity> stavke) {
        Set<Long> jeloIds = stavke.stream()
                .filter(s -> s.getIdJela() != null && !"VRECICA".equalsIgnoreCase(s.getTipStavke()))
                .map(StavkaNarudzbeEntity::getIdJela)
                .collect(Collectors.toSet());

        Set<Long> vrecicaIds = stavke.stream()
                .filter(s -> s.getIdJela() != null && (s.getTipStavke() == null
                        || s.getTipStavke().isBlank()
                        || "VRECICA".equalsIgnoreCase(s.getTipStavke())))
                .map(StavkaNarudzbeEntity::getIdJela)
                .collect(Collectors.toSet());

        Map<Long, String> jela = jeloIds.isEmpty()
                ? Map.of()
                : jeloRepository.findAllById(jeloIds).stream()
                        .collect(Collectors.toMap(JeloEntity::getId, JeloEntity::getNaziv, (a, b) -> a));

        Map<Long, String> vrecice = vrecicaIds.isEmpty()
                ? Map.of()
                : vrecicaRepository.findAllById(vrecicaIds).stream()
                        .collect(Collectors.toMap(VrecicaIznenadjenjaEntity::getId, VrecicaIznenadjenjaEntity::getNaziv, (a, b) -> a));

        return new KatalogNaziva(jela, vrecice);
    }

    public String naziv(StavkaNarudzbeEntity stavka, KatalogNaziva katalog) {
        if (stavka.getNaziv() != null && !stavka.getNaziv().isBlank()) {
            return stavka.getNaziv();
        }
        if (stavka.getIdJela() != null && katalog != null) {
            String izKataloga = null;
            if ("VRECICA".equalsIgnoreCase(stavka.getTipStavke())) {
                izKataloga = katalog.vrecice().get(stavka.getIdJela());
            } else if (stavka.getTipStavke() == null || stavka.getTipStavke().isBlank()) {
                izKataloga = katalog.jela().get(stavka.getIdJela());
                if (izKataloga == null) {
                    izKataloga = katalog.vrecice().get(stavka.getIdJela());
                }
            } else {
                izKataloga = katalog.jela().get(stavka.getIdJela());
            }
            if (izKataloga != null && !izKataloga.isBlank()) {
                return izKataloga;
            }
        }
        if ("VRECICA".equalsIgnoreCase(stavka.getTipStavke())) {
            return "Vrećica iznenađenja";
        }
        return "Jelo";
    }

    public record KatalogNaziva(Map<Long, String> jela, Map<Long, String> vrecice) {}

    public String nazivZaNovuStavku(String tipStavke, Long idArtikla, String predlozeniNaziv) {
        if (predlozeniNaziv != null && !predlozeniNaziv.isBlank()) {
            return predlozeniNaziv;
        }
        if (idArtikla == null) {
            return "VRECICA".equalsIgnoreCase(tipStavke) ? "Vrećica iznenađenja" : "Jelo";
        }
        if ("VRECICA".equalsIgnoreCase(tipStavke)) {
            return vrecicaRepository.findById(idArtikla)
                    .map(VrecicaIznenadjenjaEntity::getNaziv)
                    .filter(Objects::nonNull)
                    .filter(n -> !n.isBlank())
                    .orElse("Vrećica iznenađenja");
        }
        return jeloRepository.findById(idArtikla)
                .map(JeloEntity::getNaziv)
                .filter(Objects::nonNull)
                .filter(n -> !n.isBlank())
                .orElse("Jelo");
    }
}
