package com.eatery.eaterybackend.util;

import com.eatery.eaterybackend.entity.KorisnikEntity;
import org.hibernate.proxy.HibernateProxy;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public final class SuspenzijaUtil {

    public static final DateTimeFormatter FORMAT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy. HH:mm:ss");

    private SuspenzijaUtil() {
    }

    public static boolean jeAktivna(KorisnikEntity korisnik) {
        KorisnikEntity k = unwrap(korisnik);
        if (k == null || k.getSuspendovanDo() == null) {
            return false;
        }
        return LocalDateTime.now().isBefore(k.getSuspendovanDo());
    }

    public static boolean ocistiAkoIstekla(KorisnikEntity korisnik) {
        KorisnikEntity k = unwrap(korisnik);
        if (k == null || jeAktivna(k)) {
            return false;
        }
        boolean biloPostavljeno = Boolean.TRUE.equals(k.getSuspendovan()) || k.getSuspendovanDo() != null;
        if (!biloPostavljeno) {
            return false;
        }
        skini(k);
        return true;
    }

    public static void primijeni(KorisnikEntity korisnik, LocalDateTime doKad) {
        KorisnikEntity k = unwrap(korisnik);
        k.setSuspendovan(true);
        k.setSuspendovanDo(doKad);
    }

    public static void skini(KorisnikEntity korisnik) {
        KorisnikEntity k = unwrap(korisnik);
        k.setSuspendovan(false);
        k.setSuspendovanDo(null);
    }

    public static String poruka(KorisnikEntity korisnik) {
        KorisnikEntity k = unwrap(korisnik);
        String datum = k.getSuspendovanDo() != null ? k.getSuspendovanDo().format(FORMAT) : "";
        return "Nalog je suspendovan do " + datum + ".";
    }

    @SuppressWarnings("unchecked")
    private static <T> T unwrap(T entity) {
        if (entity instanceof HibernateProxy proxy) {
            return (T) proxy.getHibernateLazyInitializer().getImplementation();
        }
        return entity;
    }
}
