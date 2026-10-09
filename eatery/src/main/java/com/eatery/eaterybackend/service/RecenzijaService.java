package com.eatery.eaterybackend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatery.eaterybackend.dto.RestoranOcjenaDTO;
import com.eatery.eaterybackend.repository.RecenzijaRepository;

@Service
public class RecenzijaService {

    private final RecenzijaRepository recenzijaRepository;

    public RecenzijaService(RecenzijaRepository recenzijaRepository) {
        this.recenzijaRepository = recenzijaRepository;
    }

    @Transactional(readOnly = true)
    public RestoranOcjenaDTO ocjenaZaRestoran(Long restoranId) {
        if (restoranId == null) {
            return new RestoranOcjenaDTO(0.0, 0L);
        }

        List<Object[]> redovi = recenzijaRepository.agregirajOcjenePoRestoranu(restoranId);
        Object[] red = izvuciRed(redovi);

        long broj = Math.round(kaoBroj(red.length > 1 ? red[1] : 0));
        double prosjek = broj == 0 ? 0.0 : Math.round(kaoBroj(red[0]) * 10.0) / 10.0;

        return new RestoranOcjenaDTO(prosjek, broj);
    }

    private Object[] izvuciRed(List<Object[]> redovi) {
        if (redovi == null || redovi.isEmpty() || redovi.get(0) == null) {
            return new Object[] {0, 0};
        }
        Object prvi = redovi.get(0);
        if (prvi instanceof Object[] arr) {
            return arr;
        }
        Object drugi = redovi.size() > 1 ? redovi.get(1) : 0;
        return new Object[] {prvi, drugi};
    }

    private double kaoBroj(Object value) {
        if (value instanceof Number n) {
            return n.doubleValue();
        }
        return 0;
    }
}
