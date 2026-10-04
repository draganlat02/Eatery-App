import React, { useCallback, useEffect, useState } from 'react';
import API from '../api';
import './AdminPanel.css';

function AdminPanel({ user, onLogout }) {
    const [sekcija, setSekcija] = useState('zahtjevi');
    const [poruka, setPoruka] = useState('');

    const [zahtjevi, setZahtjevi] = useState([]);
    const [zahtjeviLoading, setZahtjeviLoading] = useState(true);
    const [obradaId, setObradaId] = useState(null);

    const [oglasi, setOglasi] = useState([]);
    const [oglasiLoading, setOglasiLoading] = useState(false);
    const [brisanjeId, setBrisanjeId] = useState(null);

    const [korisnici, setKorisnici] = useState([]);
    const [korisniciLoading, setKorisniciLoading] = useState(false);
    const [pretraga, setPretraga] = useState('');
    const [aktiviranFilter, setAktiviranFilter] = useState('');
    const [sort, setSort] = useState('id');
    const [dir, setDir] = useState('asc');
    const [aktivacijaId, setAktivacijaId] = useState(null);
    const [suspenzijaId, setSuspenzijaId] = useState(null);
    const [suspenzijaForma, setSuspenzijaForma] = useState(null);

    const ucitajZahtjeve = useCallback(async () => {
        try {
            setZahtjeviLoading(true);
            const res = await API.get('/admin/zahtjevi');
            setZahtjevi(res.data);
        } catch (err) {
            const porukaGreske = err.response?.data?.message || err.message || 'Nepoznata greška';
            setPoruka(`Greška: ${porukaGreske}`);
        } finally {
            setZahtjeviLoading(false);
        }
    }, []);

    const ucitajOglase = useCallback(async () => {
        try {
            setOglasiLoading(true);
            const res = await API.get('/admin/oglasi');
            setOglasi(res.data);
        } catch (err) {
            const porukaGreske = err.response?.data?.message || err.message || 'Nepoznata greška';
            setPoruka(`Greška: ${porukaGreske}`);
        } finally {
            setOglasiLoading(false);
        }
    }, []);

    const ucitajKorisnike = useCallback(async () => {
        if (sekcija !== 'kupci' && sekcija !== 'klijenti') return;
        try {
            setKorisniciLoading(true);
            const putanja = sekcija === 'kupci' ? '/admin/kupci' : '/admin/klijenti';
            const res = await API.get(putanja, {
                params: {
                    q: pretraga.trim() || undefined,
                    aktiviran: aktiviranFilter === '' ? undefined : aktiviranFilter === 'true',
                    sort,
                    dir
                }
            });
            setKorisnici(res.data);
        } catch (err) {
            const porukaGreske = err.response?.data?.message || err.message || 'Nepoznata greška';
            setPoruka(`Greška: ${porukaGreske}`);
        } finally {
            setKorisniciLoading(false);
        }
    }, [sekcija, pretraga, aktiviranFilter, sort, dir]);

    useEffect(() => {
        ucitajZahtjeve();
    }, [ucitajZahtjeve]);

    useEffect(() => {
        if (sekcija === 'oglasi') {
            ucitajOglase();
        }
    }, [sekcija, ucitajOglase]);

    useEffect(() => {
        if (sekcija !== 'kupci' && sekcija !== 'klijenti') return undefined;
        const t = setTimeout(() => {
            ucitajKorisnike();
        }, pretraga ? 250 : 0);
        return () => clearTimeout(t);
    }, [sekcija, ucitajKorisnike, pretraga]);

    const obradiZahtjev = async (id, odobreno) => {
        try {
            setObradaId(id);
            const res = await API.post(`/admin/zahtjevi/${id}/obradi?odobreno=${odobreno}`);
            setPoruka(typeof res.data === 'string' ? res.data : 'Zahtjev je uspješno obrađen.');
            setZahtjevi((prev) => prev.filter((z) => z.id !== id));
        } catch (err) {
            const porukaGreske = err.response?.data?.message || 'Došlo je do greške prilikom obrade zahtjeva.';
            setPoruka(`Greška: ${porukaGreske}`);
        } finally {
            setObradaId(null);
        }
    };

    const aktivirajKlijenta = async (id) => {
        try {
            setAktivacijaId(id);
            const res = await API.post(`/admin/korisnici/${id}/aktiviraj`);
            setPoruka(typeof res.data === 'string' ? res.data : 'Restoran je aktiviran.');
            setKorisnici((prev) =>
                prev.map((k) => (k.id === id ? { ...k, aktiviran: true } : k))
            );
            ucitajZahtjeve();
        } catch (err) {
            const porukaGreske = err.response?.data?.message || 'Nalog nije mogao biti aktiviran.';
            setPoruka(`Greška: ${porukaGreske}`);
        } finally {
            setAktivacijaId(null);
        }
    };

    const obrisiOglas = async (id) => {
        if (!window.confirm('Obrisati ovaj oglas? Radnja se ne može poništiti.')) {
            return;
        }
        try {
            setBrisanjeId(id);
            const res = await API.delete(`/admin/oglasi/${id}`);
            setPoruka(typeof res.data === 'string' ? res.data : 'Oglas je obrisan.');
            setOglasi((prev) => prev.filter((o) => o.id !== id));
        } catch (err) {
            const porukaGreske = err.response?.data?.message || 'Oglas nije mogao biti obrisan.';
            setPoruka(`Greška: ${porukaGreske}`);
        } finally {
            setBrisanjeId(null);
        }
    };

    const promeniSort = (polje) => {
        if (sort === polje) {
            setDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSort(polje);
            setDir('asc');
        }
    };

    const sortOznaka = (polje) => {
        if (sort !== polje) return '';
        return dir === 'asc' ? ' ↑' : ' ↓';
    };

    const formatCijena = (vrijednost) => {
        if (vrijednost == null) return '—';
        return `${Number(vrijednost).toFixed(2)} KM`;
    };

    const nazivUloge = (uloga) => {
        if (uloga === 'KLIJENT') return 'Restoran';
        if (uloga === 'KUPAC') return 'Kupac';
        return uloga || '—';
    };

    const parseDatum = (vrijednost) => {
        if (vrijednost == null || vrijednost === '') return null;
        if (Array.isArray(vrijednost)) {
            const [y, m, d, h = 0, min = 0, s = 0] = vrijednost;
            const parsed = new Date(y, (m || 1) - 1, d, h, min, s);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }
        const parsed = new Date(vrijednost);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const jeSuspendovan = (k) => {
        const doKad = parseDatum(k?.suspendovanDo);
        if (doKad) {
            return doKad.getTime() > Date.now();
        }
        return k?.suspendovan === true;
    };

    const formatDatum = (vrijednost) => {
        const d = parseDatum(vrijednost);
        if (!d) return vrijednost ? String(vrijednost) : '—';
        return d.toLocaleString(undefined, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const renderStatus = (k, { prikaziAktivaciju = true } = {}) => {
        if (jeSuspendovan(k)) {
            return (
                <div className="admin-status">
                    <span className="admin-badge is-warn">Suspendovan</span>
                    <span className="admin-status-until">do {formatDatum(k.suspendovanDo)}</span>
                </div>
            );
        }
        if (!prikaziAktivaciju) return null;
        return (
            <div className="admin-status">
                <span className={k.aktiviran ? 'admin-badge is-on' : 'admin-badge'}>
                    {k.aktiviran ? 'Aktiviran' : 'Neaktiviran'}
                </span>
            </div>
        );
    };

    const datetimeLocalNow = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const toIsoLocal = (value) => {
        if (!value) return null;
        return value.length === 16 ? `${value}:00` : value;
    };

    const otvoriSuspenziju = (k) => {
        setSuspenzijaForma({
            id: k.id,
            prikazIme: k.prikazIme || k.korisnickoIme,
            period: '7',
            until: datetimeLocalNow(),
            sekunde: '30'
        });
    };

    const potvrdiSuspenziju = async () => {
        if (!suspenzijaForma) return;
        const { id, prikazIme, period, until, sekunde } = suspenzijaForma;
        const sekundePreset = { '30s': 30, '60s': 60, '300s': 300 };
        let body;

        if (period === 'custom') {
            if (!until) {
                setPoruka('Greška: Odaberite datum i vrijeme do kada suspenzija vrijedi.');
                return;
            }
            body = { suspendovanDo: toIsoLocal(until) };
        } else if (sekundePreset[period] != null) {
            body = { sekunde: sekundePreset[period] };
        } else if (period === 'sekunde') {
            const broj = Number(sekunde);
            if (!Number.isInteger(broj) || broj <= 0) {
                setPoruka('Greška: Unesite broj sekundi veći od nule.');
                return;
            }
            body = { sekunde: broj };
        } else {
            body = { dani: Number(period) };
        }

        if (!window.confirm(`Suspendovati nalog "${prikazIme}"?`)) {
            return;
        }

        try {
            setSuspenzijaId(id);
            const res = await API.post(`/admin/korisnici/${id}/suspenduj`, body);
            setPoruka(typeof res.data === 'string' ? res.data : 'Nalog je suspendovan.');
            setSuspenzijaForma(null);
            ucitajKorisnike();
        } catch (err) {
            const porukaGreske = err.response?.data?.message || 'Nalog nije mogao biti suspendovan.';
            setPoruka(`Greška: ${porukaGreske}`);
        } finally {
            setSuspenzijaId(null);
        }
    };

    const skiniSuspenziju = async (k) => {
        if (!window.confirm(`Ukloniti suspenziju za "${k.prikazIme || k.korisnickoIme}"?`)) {
            return;
        }
        try {
            setSuspenzijaId(k.id);
            const res = await API.post(`/admin/korisnici/${k.id}/skini-suspenziju`);
            setPoruka(typeof res.data === 'string' ? res.data : 'Suspenzija je uklonjena.');
            ucitajKorisnike();
        } catch (err) {
            const porukaGreske = err.response?.data?.message || 'Suspenzija nije mogla biti uklonjena.';
            setPoruka(`Greška: ${porukaGreske}`);
        } finally {
            setSuspenzijaId(null);
        }
    };

    const heading = {
        zahtjevi: {
            title: 'Zahtjevi za aktivaciju',
            text: 'Pregledajte i odobrite restorane koji čekaju da se pojave na platformi.'
        },
        kupci: {
            title: 'Kupci',
            text: 'Pregled kupaca iz baze. Pretražite, filtrirajte i po potrebi suspendujte nalog na određeni period.'
        },
        klijenti: {
            title: 'Restorani',
            text: 'Pregled klijenata iz baze. Aktivirajte restorane ili suspendujte nalog na određeni period.'
        },
        oglasi: {
            title: 'Oglasi',
            text: 'Pregledajte vrećice iznenađenja i uklonite oglase koji krše pravila platforme.'
        }
    }[sekcija];

    const renderKorisniciTabela = (tip) => (
        <>
            <div className="admin-toolbar">
                <input
                    type="search"
                    className="admin-search"
                    placeholder={
                        tip === 'kupci'
                            ? 'Pretraži ime, korisničko ime ili email...'
                            : 'Pretraži restoran, korisničko ime, email ili adresu...'
                    }
                    value={pretraga}
                    onChange={(e) => setPretraga(e.target.value)}
                />
                <select value={aktiviranFilter} onChange={(e) => setAktiviranFilter(e.target.value)}>
                    <option value="">Svi statusi</option>
                    <option value="true">Aktivirani</option>
                    <option value="false">Neaktivirani</option>
                </select>
            </div>

            <div className="admin-card">
                {korisniciLoading ? (
                    <div className="admin-inline-loading">
                        {tip === 'kupci' ? 'Učitavanje kupaca...' : 'Učitavanje restorana...'}
                    </div>
                ) : korisnici.length === 0 ? (
                    <div className="admin-empty">
                        <h3>
                            {pretraga.trim() || aktiviranFilter
                                ? 'Nema rezultata'
                                : tip === 'kupci'
                                    ? 'Nema kupaca u bazi korisnika'
                                    : 'Nema restorana'}
                        </h3>
                        <p>
                            {pretraga.trim() || aktiviranFilter
                                ? 'Nema rezultata za zadatu pretragu ili filter.'
                                : tip === 'kupci'
                                    ? 'Nijedan korisnik sa ulogom kupca nije pronađen u tabeli korisnik.'
                                    : 'Nema rezultata za zadatu pretragu ili filter.'}
                        </p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>
                                    <button type="button" className="admin-sort" onClick={() => promeniSort('id')}>
                                        ID{sortOznaka('id')}
                                    </button>
                                </th>
                                <th>
                                    <button type="button" className="admin-sort" onClick={() => promeniSort('prikazIme')}>
                                        {tip === 'kupci' ? 'Ime' : 'Objekat'}{sortOznaka('prikazIme')}
                                    </button>
                                </th>
                                <th>
                                    <button type="button" className="admin-sort" onClick={() => promeniSort('korisnickoIme')}>
                                        Korisničko ime{sortOznaka('korisnickoIme')}
                                    </button>
                                </th>
                                <th>
                                    <button type="button" className="admin-sort" onClick={() => promeniSort('email')}>
                                        Email{sortOznaka('email')}
                                    </button>
                                </th>
                                {tip === 'klijenti' && (
                                    <th>
                                        <button type="button" className="admin-sort" onClick={() => promeniSort('adresa')}>
                                            Adresa{sortOznaka('adresa')}
                                        </button>
                                    </th>
                                )}
                                <th>
                                    <button type="button" className="admin-sort" onClick={() => promeniSort('aktiviran')}>
                                        Status{sortOznaka('aktiviran')}
                                    </button>
                                </th>
                                <th>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            {korisnici.map((k) => (
                                <tr key={k.id}>
                                    <td>{k.id}</td>
                                    <td>{k.prikazIme || '—'}</td>
                                    <td>{k.korisnickoIme}</td>
                                    <td>{k.email}</td>
                                    {tip === 'klijenti' && <td>{k.adresa || '—'}</td>}
                                    <td>{renderStatus(k)}</td>
                                    <td>
                                        <div className="admin-actions">
                                            {tip === 'klijenti' && !k.aktiviran && (
                                                <button
                                                    className="admin-approve"
                                                    type="button"
                                                    disabled={aktivacijaId === k.id}
                                                    onClick={() => aktivirajKlijenta(k.id)}
                                                >
                                                    {aktivacijaId === k.id ? 'Aktivacija...' : 'Aktiviraj'}
                                                </button>
                                            )}
                                            {jeSuspendovan(k) ? (
                                                <button
                                                    className="admin-lift"
                                                    type="button"
                                                    disabled={suspenzijaId === k.id}
                                                    onClick={() => skiniSuspenziju(k)}
                                                >
                                                    {suspenzijaId === k.id ? 'Obrada...' : 'Skini suspenziju'}
                                                </button>
                                            ) : (
                                                <button
                                                    className="admin-suspend"
                                                    type="button"
                                                    disabled={suspenzijaId === k.id}
                                                    onClick={() => otvoriSuspenziju(k)}
                                                >
                                                    Suspenduj
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );

    return (
        <div className="admin-page">
            <header className="admin-navbar">
                <div className="admin-navbar-inner">
                    <div className="admin-brand">
                        <div className="admin-logo" aria-hidden="true">E</div>
                        <div>
                            <div className="admin-brand-name">Eatery</div>
                            <div className="admin-brand-subtitle">Administracija</div>
                        </div>
                    </div>
                    <nav className="admin-tabs" aria-label="Admin sekcije">
                        <button
                            type="button"
                            className={sekcija === 'zahtjevi' ? 'is-active' : ''}
                            onClick={() => setSekcija('zahtjevi')}
                        >
                            Zahtjevi
                        </button>
                        <button
                            type="button"
                            className={sekcija === 'kupci' ? 'is-active' : ''}
                            onClick={() => { setSekcija('kupci'); setPretraga(''); setAktiviranFilter(''); }}
                        >
                            Kupci
                        </button>
                        <button
                            type="button"
                            className={sekcija === 'klijenti' ? 'is-active' : ''}
                            onClick={() => { setSekcija('klijenti'); setPretraga(''); setAktiviranFilter(''); }}
                        >
                            Restorani
                        </button>
                        <button
                            type="button"
                            className={sekcija === 'oglasi' ? 'is-active' : ''}
                            onClick={() => setSekcija('oglasi')}
                        >
                            Oglasi
                        </button>
                    </nav>
                    <div className="admin-user">
                        <span>{user?.korisnickoIme || 'Administrator'}</span>
                        {onLogout && (
                            <button className="admin-logout" type="button" onClick={onLogout}>
                                Odjava
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="admin-content">
                <div className="admin-heading">
                    <span>ADMIN PANEL</span>
                    <h1>{heading.title}</h1>
                    <p>{heading.text}</p>
                </div>

                {poruka && <div className="admin-alert">{poruka}</div>}

                {sekcija === 'zahtjevi' && (
                    <div className="admin-card">
                        {zahtjeviLoading ? (
                            <div className="admin-inline-loading">Učitavanje zahtjeva...</div>
                        ) : zahtjevi.length === 0 ? (
                            <div className="admin-empty">
                                <h3>Nema novih zahtjeva</h3>
                                <p>Trenutno nema restorana koji čekaju aktivaciju.</p>
                            </div>
                        ) : (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Uloga</th>
                                        <th>Objekat</th>
                                        <th>Korisničko ime</th>
                                        <th>Email</th>
                                        <th>Datum</th>
                                        <th>Status</th>
                                        <th>Akcije</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {zahtjevi.map((z) => (
                                        <tr key={z.id}>
                                            <td>{z.id}</td>
                                            <td>{nazivUloge(z.uloga)}</td>
                                            <td>{z.prikazIme || '—'}</td>
                                            <td>{z.korisnickoIme || 'N/A'}</td>
                                            <td>{z.email || 'N/A'}</td>
                                            <td>
                                                {z.datumPodnosenja
                                                    ? new Date(z.datumPodnosenja).toLocaleString()
                                                    : 'N/A'}
                                            </td>
                                            <td>{renderStatus(z, { prikaziAktivaciju: false }) || '—'}</td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        className="admin-approve"
                                                        type="button"
                                                        disabled={obradaId === z.id}
                                                        onClick={() => obradiZahtjev(z.id, true)}
                                                    >
                                                        {obradaId === z.id ? 'Obrada...' : 'Odobri'}
                                                    </button>
                                                    <button
                                                        className="admin-reject"
                                                        type="button"
                                                        disabled={obradaId === z.id}
                                                        onClick={() => obradiZahtjev(z.id, false)}
                                                    >
                                                        {obradaId === z.id ? 'Obrada...' : 'Odbij'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {sekcija === 'kupci' && renderKorisniciTabela('kupci')}
                {sekcija === 'klijenti' && renderKorisniciTabela('klijenti')}

                {sekcija === 'oglasi' && (
                    <div className="admin-card">
                        {oglasiLoading ? (
                            <div className="admin-inline-loading">Učitavanje oglasa...</div>
                        ) : oglasi.length === 0 ? (
                            <div className="admin-empty">
                                <h3>Nema oglasa</h3>
                                <p>Trenutno nema objavljenih vrećica iznenađenja.</p>
                            </div>
                        ) : (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Oglas</th>
                                        <th>Restoran</th>
                                        <th>Cijena</th>
                                        <th>Količina</th>
                                        <th>Status</th>
                                        <th>Akcije</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {oglasi.map((o) => (
                                        <tr key={o.id}>
                                            <td>
                                                <strong>{o.naziv}</strong>
                                                {o.opis && <div className="admin-muted">{o.opis}</div>}
                                            </td>
                                            <td>{o.restoran || 'N/A'}</td>
                                            <td>
                                                {formatCijena(o.akcijskaCijena)}
                                                {o.originalnaCijena != null && (
                                                    <div className="admin-muted">
                                                        orig. {formatCijena(o.originalnaCijena)}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{o.kolicina ?? '—'}</td>
                                            <td>
                                                <span className={o.aktivna ? 'admin-badge is-on' : 'admin-badge'}>
                                                    {o.aktivna ? 'Aktivan' : 'Neaktivan'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="admin-reject"
                                                    type="button"
                                                    disabled={brisanjeId === o.id}
                                                    onClick={() => obrisiOglas(o.id)}
                                                >
                                                    {brisanjeId === o.id ? 'Brisanje...' : 'Obriši'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </main>

            {suspenzijaForma && (
                <div className="admin-modal-backdrop" role="presentation" onClick={() => setSuspenzijaForma(null)}>
                    <div
                        className="admin-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="suspenzija-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="suspenzija-title">Suspenduj nalog</h2>
                        <p>
                            Odaberite period suspenzije za <strong>{suspenzijaForma.prikazIme}</strong>.
                            Dok traje suspenzija, prijava nije moguća.
                        </p>
                        <div className="admin-period">
                            {[
                                { value: '1', label: '1 dan' },
                                { value: '7', label: '7 dana' },
                                { value: '30', label: '30 dana' },
                                { value: '30s', label: '30 s' },
                                { value: '60s', label: '60 s' },
                                { value: '300s', label: '300 s' },
                                { value: 'sekunde', label: 'Po sekundama' },
                                { value: 'custom', label: 'Do datuma i vremena' }
                            ].map((opcija) => (
                                <label key={opcija.value} className={suspenzijaForma.period === opcija.value ? 'is-active' : ''}>
                                    <input
                                        type="radio"
                                        name="period-suspenzije"
                                        value={opcija.value}
                                        checked={suspenzijaForma.period === opcija.value}
                                        onChange={() => setSuspenzijaForma((prev) => ({ ...prev, period: opcija.value }))}
                                    />
                                    {opcija.label}
                                </label>
                            ))}
                        </div>
                        {suspenzijaForma.period === 'sekunde' && (
                            <label className="admin-datetime">
                                Trajanje u sekundama
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={suspenzijaForma.sekunde}
                                    onChange={(e) => setSuspenzijaForma((prev) => ({ ...prev, sekunde: e.target.value }))}
                                />
                            </label>
                        )}
                        {suspenzijaForma.period === 'custom' && (
                            <label className="admin-datetime">
                                Suspendovan do
                                <input
                                    type="datetime-local"
                                    min={datetimeLocalNow()}
                                    value={suspenzijaForma.until}
                                    onChange={(e) => setSuspenzijaForma((prev) => ({ ...prev, until: e.target.value }))}
                                />
                            </label>
                        )}
                        <div className="admin-actions">
                            <button
                                className="admin-suspend"
                                type="button"
                                disabled={suspenzijaId === suspenzijaForma.id}
                                onClick={potvrdiSuspenziju}
                            >
                                {suspenzijaId === suspenzijaForma.id ? 'Obrada...' : 'Potvrdi suspenziju'}
                            </button>
                            <button className="admin-logout" type="button" onClick={() => setSuspenzijaForma(null)}>
                                Odustani
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPanel;
