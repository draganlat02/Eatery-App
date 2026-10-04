package com.eatery.eaterybackend.service;

import com.eatery.eaterybackend.dto.AdminKorisnikDTO;
import com.eatery.eaterybackend.dto.AdminOglasDTO;
import com.eatery.eaterybackend.dto.AdminSuspenzijaDTO;
import com.eatery.eaterybackend.dto.AdminZahtjevDTO;
import com.eatery.eaterybackend.entity.KlijentEntity;
import com.eatery.eaterybackend.entity.KorisnikEntity;
import com.eatery.eaterybackend.entity.KupacEntity;
import com.eatery.eaterybackend.entity.VrecicaIznenadjenjaEntity;
import com.eatery.eaterybackend.entity.ZahtjevZaAktivacijuEntity;
import com.eatery.eaterybackend.repository.KlijentRepository;
import com.eatery.eaterybackend.repository.KorisnikRepository;
import com.eatery.eaterybackend.repository.KupacRepository;
import com.eatery.eaterybackend.repository.VrecicaIznenadjenjaRepository;
import com.eatery.eaterybackend.repository.ZahtjevZaAktivacijuRepository;
import com.eatery.eaterybackend.util.SuspenzijaUtil;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

@Service
public class AdminService {

    private final ZahtjevZaAktivacijuRepository zahtjevRepository;
    private final KorisnikRepository korisnikRepository;
    private final KupacRepository kupacRepository;
    private final KlijentRepository klijentRepository;
    private final VrecicaIznenadjenjaRepository vrecicaRepository;

    public AdminService(ZahtjevZaAktivacijuRepository zahtjevRepository,
                        KorisnikRepository korisnikRepository,
                        KupacRepository kupacRepository,
                        KlijentRepository klijentRepository,
                        VrecicaIznenadjenjaRepository vrecicaRepository) {
        this.zahtjevRepository = zahtjevRepository;
        this.korisnikRepository = korisnikRepository;
        this.kupacRepository = kupacRepository;
        this.klijentRepository = klijentRepository;
        this.vrecicaRepository = vrecicaRepository;
    }

    public void requireAdmin(Authentication authentication) {
        trenutniAdmin(authentication);
    }

    private KorisnikEntity trenutniAdmin(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalStateException("Niste autentifikovani!");
        }
        KorisnikEntity admin = unwrap(korisnikRepository.findByKorisnickoIme(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Niste autentifikovani!")));
        if (admin.getUloga() == null || !"ADMINISTRATOR".equalsIgnoreCase(admin.getUloga())) {
            throw new IllegalStateException("Samo administrator može pristupiti ovoj funkciji!");
        }
        return admin;
    }

    private LocalDateTime izracunajSuspendovanDo(AdminSuspenzijaDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Odaberite period suspenzije ili datum do kada vrijedi.");
        }
        if (dto.getSekunde() != null) {
            if (dto.getSekunde() <= 0) {
                throw new IllegalArgumentException("Broj sekundi mora biti veći od nule.");
            }
            return LocalDateTime.now().plusSeconds(dto.getSekunde());
        }
        if (dto.getSuspendovanDo() != null) {
            return dto.getSuspendovanDo();
        }
        if (dto.getDani() != null && dto.getDani() > 0) {
            return LocalDateTime.now().plusDays(dto.getDani());
        }
        throw new IllegalArgumentException("Odaberite period suspenzije ili datum do kada vrijedi.");
    }

    @Transactional(readOnly = true)
    public List<AdminZahtjevDTO> getSveZahtjeve() {
        return zahtjevRepository.findAll().stream()
                .filter(z -> {
                    KorisnikEntity k = unwrap(z.getKorisnik());
                    return k != null && "KLIJENT".equalsIgnoreCase(k.getUloga());
                })
                .sorted(Comparator.comparing(ZahtjevZaAktivacijuEntity::getDatumPodnosenja,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toZahtjevDto)
                .toList();
    }

    @Transactional
    public String obradiZahtjev(Long idZahtjeva, boolean odobreno) {
        ZahtjevZaAktivacijuEntity zahtjev = zahtjevRepository.findById(idZahtjeva)
                .orElseThrow(() -> new IllegalArgumentException("Zahtjev nije pronađen!"));

        KorisnikEntity korisnik = unwrap(zahtjev.getKorisnik());
        zahtjevRepository.delete(zahtjev);

        if (odobreno) {
            korisnik.setAktiviran(true);
            korisnikRepository.save(korisnik);
            return "Nalog je uspješno aktiviran!";
        }

        obrisiKorisnika(korisnik);
        return "Zahtjev je odbijen i nalog je obrisan!";
    }

    @Transactional
    public String aktivirajKorisnika(Long id) {
        KorisnikEntity korisnik = unwrap(korisnikRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Korisnik nije pronađen!")));

        if (!"KLIJENT".equalsIgnoreCase(korisnik.getUloga())) {
            throw new IllegalStateException("Aktivacija je potrebna samo za restorane!");
        }

        korisnik.setAktiviran(true);
        korisnikRepository.save(korisnik);
        zahtjevRepository.findByKorisnikId(id).ifPresent(zahtjevRepository::delete);
        return "Nalog je uspješno aktiviran!";
    }

    @Transactional
    public String suspendujKorisnika(Long id, AdminSuspenzijaDTO dto, Authentication authentication) {
        KorisnikEntity admin = trenutniAdmin(authentication);
        KorisnikEntity korisnik = unwrap(korisnikRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Korisnik nije pronađen!")));

        if (admin.getId() != null && admin.getId().equals(korisnik.getId())) {
            throw new IllegalStateException("Ne možete suspendovati vlastiti nalog!");
        }
        if ("ADMINISTRATOR".equalsIgnoreCase(korisnik.getUloga())) {
            throw new IllegalStateException("Administrator ne može biti suspendovan!");
        }
        if (!"KUPAC".equalsIgnoreCase(korisnik.getUloga())
                && !"KLIJENT".equalsIgnoreCase(korisnik.getUloga())) {
            throw new IllegalStateException("Suspenzija je dostupna samo za kupce i restorane!");
        }

        LocalDateTime doKad = izracunajSuspendovanDo(dto);
        if (!doKad.isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Suspenzija mora trajati do datuma u budućnosti!");
        }

        SuspenzijaUtil.primijeni(korisnik, doKad);
        korisnikRepository.save(korisnik);
        return "Nalog je suspendovan do " + doKad.format(SuspenzijaUtil.FORMAT) + ".";
    }

    @Transactional
    public String skiniSuspenziju(Long id, Authentication authentication) {
        trenutniAdmin(authentication);
        KorisnikEntity korisnik = unwrap(korisnikRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Korisnik nije pronađen!")));

        if ("ADMINISTRATOR".equalsIgnoreCase(korisnik.getUloga())) {
            throw new IllegalStateException("Administrator ne može biti suspendovan!");
        }

        SuspenzijaUtil.skini(korisnik);
        korisnikRepository.save(korisnik);
        return "Suspenzija je uklonjena. Korisnik se može ponovo prijaviti.";
    }

    @Transactional(readOnly = true)
    public List<AdminKorisnikDTO> getKupce(String q, Boolean aktiviran, String sort, String dir) {
        Map<Long, AdminKorisnikDTO> poId = new LinkedHashMap<>();
        for (KupacEntity kupac : kupacRepository.findAll()) {
            poId.put(kupac.getId(), toKorisnikDto(kupac));
        }
        for (KorisnikEntity korisnik : korisnikRepository.findAll()) {
            KorisnikEntity k = unwrap(korisnik);
            if (k == null || k.getId() == null || k.getUloga() == null
                    || !"KUPAC".equalsIgnoreCase(k.getUloga())) {
                continue;
            }
            poId.putIfAbsent(k.getId(), toKorisnikDto(k));
        }
        return filterSort(poId.values().stream(), q, aktiviran, sort, dir);
    }

    @Transactional(readOnly = true)
    public List<AdminKorisnikDTO> getKlijente(String q, Boolean aktiviran, String sort, String dir) {
        return filterSort(klijentRepository.findAll().stream().map(this::toKorisnikDto), q, aktiviran, sort, dir);
    }

    @Transactional(readOnly = true)
    public List<AdminOglasDTO> getOglase() {
        return vrecicaRepository.findAll().stream()
                .sorted(Comparator.comparing(VrecicaIznenadjenjaEntity::getId).reversed())
                .map(this::toOglasDto)
                .toList();
    }

    @Transactional
    public String obrisiOglas(Long id) {
        VrecicaIznenadjenjaEntity oglas = vrecicaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Oglas nije pronađen!"));
        vrecicaRepository.delete(oglas);
        return "Oglas je uspješno obrisan.";
    }

    private List<AdminKorisnikDTO> filterSort(Stream<AdminKorisnikDTO> stream,
                                              String q,
                                              Boolean aktiviran,
                                              String sort,
                                              String dir) {
        String query = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        String sortField = sort == null || sort.isBlank() ? "id" : sort.trim();
        boolean ascending = dir == null || !"desc".equalsIgnoreCase(dir.trim());

        Stream<AdminKorisnikDTO> filtered = stream
                .filter(k -> aktiviran == null || aktiviran.equals(k.getAktiviran()))
                .filter(k -> query.isEmpty() || matchesSearch(k, query));

        Comparator<AdminKorisnikDTO> comparator = comparatorFor(sortField);
        if (!ascending) {
            comparator = comparator.reversed();
        }

        return filtered.sorted(comparator).toList();
    }

    private boolean matchesSearch(AdminKorisnikDTO k, String query) {
        return contains(k.getKorisnickoIme(), query)
                || contains(k.getEmail(), query)
                || contains(k.getPrikazIme(), query)
                || contains(k.getAdresa(), query);
    }

    private boolean contains(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }

    private boolean imaTekst(String value) {
        return value != null && !value.isBlank();
    }

    private Comparator<AdminKorisnikDTO> comparatorFor(String sortField) {
        return switch (sortField) {
            case "korisnickoIme" -> Comparator.comparing(AdminKorisnikDTO::getKorisnickoIme, this::compareText);
            case "email" -> Comparator.comparing(AdminKorisnikDTO::getEmail, this::compareText);
            case "uloga" -> Comparator.comparing(AdminKorisnikDTO::getUloga, this::compareText);
            case "aktiviran" -> Comparator.comparing(k -> Boolean.TRUE.equals(k.getAktiviran()));
            case "prikazIme" -> Comparator.comparing(AdminKorisnikDTO::getPrikazIme, this::compareText);
            case "adresa" -> Comparator.comparing(AdminKorisnikDTO::getAdresa, this::compareText);
            default -> Comparator.comparing(AdminKorisnikDTO::getId, Comparator.nullsLast(Long::compareTo));
        };
    }

    private int compareText(String a, String b) {
        return Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER).compare(a, b);
    }

    private void obrisiKorisnika(KorisnikEntity korisnik) {
        if (korisnik instanceof KupacEntity kupac) {
            kupacRepository.delete(kupac);
        } else if (korisnik instanceof KlijentEntity klijent) {
            klijentRepository.delete(klijent);
        } else {
            korisnikRepository.delete(korisnik);
        }
    }

    private AdminZahtjevDTO toZahtjevDto(ZahtjevZaAktivacijuEntity zahtjev) {
        AdminKorisnikDTO korisnik = zahtjev.getKorisnik() == null ? null : toKorisnikDto(zahtjev.getKorisnik());
        AdminZahtjevDTO dto = new AdminZahtjevDTO();
        dto.setId(zahtjev.getId());
        dto.setDatumPodnosenja(zahtjev.getDatumPodnosenja());
        if (korisnik != null) {
            dto.setKorisnikId(korisnik.getId());
            dto.setKorisnickoIme(korisnik.getKorisnickoIme());
            dto.setEmail(korisnik.getEmail());
            dto.setUloga(korisnik.getUloga());
            dto.setPrikazIme(korisnik.getPrikazIme());
            dto.setSuspendovan(korisnik.getSuspendovan());
            dto.setSuspendovanDo(korisnik.getSuspendovanDo());
        }
        return dto;
    }

    private AdminKorisnikDTO toKorisnikDto(KorisnikEntity k) {
        k = unwrap(k);
        AdminKorisnikDTO dto = new AdminKorisnikDTO();
        dto.setId(k.getId());
        dto.setKorisnickoIme(k.getKorisnickoIme());
        dto.setEmail(k.getEmail());
        dto.setUloga(k.getUloga());
        dto.setAktiviran(k.getAktiviran());
        boolean aktivnaSuspenzija = SuspenzijaUtil.jeAktivna(k);
        dto.setSuspendovan(aktivnaSuspenzija);
        dto.setSuspendovanDo(aktivnaSuspenzija ? k.getSuspendovanDo() : null);
        if (k instanceof KupacEntity kupac) {
            dto.setPrikazIme(imaTekst(kupac.getIme()) ? kupac.getIme() : k.getKorisnickoIme());
        } else if (k instanceof KlijentEntity klijent) {
            dto.setPrikazIme(klijent.getNazivObjekta());
            dto.setAdresa(klijent.getAdresa());
        } else if ("KUPAC".equalsIgnoreCase(k.getUloga())) {
            dto.setPrikazIme(k.getKorisnickoIme());
        } else {
            dto.setPrikazIme("Administrator");
        }
        return dto;
    }

    private AdminOglasDTO toOglasDto(VrecicaIznenadjenjaEntity v) {
        AdminOglasDTO dto = new AdminOglasDTO();
        dto.setId(v.getId());
        dto.setNaziv(v.getNaziv());
        dto.setOpis(v.getOpis());
        dto.setOriginalnaCijena(v.getOriginalnaCijena());
        dto.setAkcijskaCijena(v.getAkcijskaCijena());
        dto.setKolicina(v.getKolicina());
        dto.setAktivna(v.getAktivna());
        dto.setVrijemePreuzimanjaOd(v.getVrijemePreuzimanjaOd());
        dto.setVrijemePreuzimanjaDo(v.getVrijemePreuzimanjaDo());
        dto.setVrijemeKreiranja(v.getVrijemeKreiranja());
        if (v.getRestoran() != null) {
            KorisnikEntity restoran = unwrap(v.getRestoran());
            dto.setRestoranId(restoran.getId());
            if (restoran instanceof KlijentEntity klijent && klijent.getNazivObjekta() != null) {
                dto.setRestoran(klijent.getNazivObjekta());
            } else {
                dto.setRestoran(restoran.getKorisnickoIme());
            }
        }
        return dto;
    }

    @SuppressWarnings("unchecked")
    private <T> T unwrap(T entity) {
        if (entity instanceof HibernateProxy proxy) {
            return (T) proxy.getHibernateLazyInitializer().getImplementation();
        }
        return entity;
    }
}
