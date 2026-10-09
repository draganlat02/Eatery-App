package com.eatery.eaterybackend.service;

import com.eatery.eaterybackend.entity.KlijentEntity;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class RadnoVrijemeService {

    private static final ZoneId ZONA = ZoneId.of("Europe/Sarajevo");
    private static final Pattern SATI = Pattern.compile("^(\\d{1,2}):(\\d{2})");

    public boolean jeOtvoren(KlijentEntity restoran) {
        if (restoran == null) {
            return true;
        }
        return jeOtvoren(restoran.getRadnoVrijemeOd(), restoran.getRadnoVrijemeDo());
    }

    public boolean jeOtvoren(String od, String doVrijeme) {
        LocalTime from = parsujVrijeme(od);
        LocalTime to = parsujVrijeme(doVrijeme);
        if (from == null || to == null) {
            return true;
        }

        LocalTime sada = LocalTime.now(ZONA);
        if (from.equals(to)) {
            return true;
        }
        if (from.isBefore(to)) {
            return !sada.isBefore(from) && sada.isBefore(to);
        }
        return !sada.isBefore(from) || sada.isBefore(to);
    }

    public String porukaZatvoren(KlijentEntity restoran) {
        String od = restoran != null ? normalizuj(restoran.getRadnoVrijemeOd()) : null;
        String doV = restoran != null ? normalizuj(restoran.getRadnoVrijemeDo()) : null;
        if (od != null && doV != null) {
            return "Restoran je trenutno zatvoren. Narudžba nije moguća. Radno vrijeme: " + od + " – " + doV + ".";
        }
        return "Restoran je trenutno zatvoren. Narudžba nije moguća.";
    }

    private LocalTime parsujVrijeme(String vrijeme) {
        if (vrijeme == null || vrijeme.isBlank()) {
            return null;
        }
        Matcher m = SATI.matcher(vrijeme.trim());
        if (!m.find()) {
            return null;
        }
        int h = Integer.parseInt(m.group(1));
        int min = Integer.parseInt(m.group(2));
        if (h > 23 || min > 59) {
            return null;
        }
        return LocalTime.of(h, min);
    }

    private String normalizuj(String vrijeme) {
        LocalTime parsed = parsujVrijeme(vrijeme);
        return parsed != null ? parsed.toString() : null;
    }
}
