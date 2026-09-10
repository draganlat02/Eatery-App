import React, { useState, useEffect } from 'react';
import API from './api';
import MojeNarudzbe from './MojeNarudzbe';
import HeroVrecice from './components/HeroVrecice';
import './KupacPanel.css';

function KupacPanel({ user }) {
    const [restorani, setRestorani] = useState([]);
    const [izabraniRestoran, setIzabraniRestoran] = useState(null);
    const [jela, setJela] = useState([]);
    const [korpa, setKorpa] = useState([]);
    const [adresa, setAdresa] = useState('');
    const [poruka, setPoruka] = useState('');
    const [osveziNarudzbe, setOsveziNarudzbe] = useState(0);

    // Trenutni prikaz: restorani ili narudžbe
    const [aktivnaStranica, setAktivnaStranica] =
        useState('restorani');

    // Pretraga restorana
    const [pretraga, setPretraga] = useState('');

    useEffect(() => {
        API.get('/kupac/restorani')
            .then(res => setRestorani(res.data))
            .catch(err => console.error(err));
    }, []);

    const izaberiRestoran = async (restoran) => {
        setIzabraniRestoran(restoran);
        setAktivnaStranica('restorani');
        setKorpa([]);

        try {
            const res = await API.get(
                `/restoran/${restoran.id}/jela`
            );

            setJela(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const idiNaRestorane = () => {
        setAktivnaStranica('restorani');
        setIzabraniRestoran(null);
        setPretraga('');

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const idiNaNarudzbe = () => {
        setAktivnaStranica('narudzbe');
        setIzabraniRestoran(null);

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const dodajUKorpu = (jelo) => {
        const postojeca = korpa.find(
            item => item.jelo.id === jelo.id
        );

        if (postojeca) {
            setKorpa(
                korpa.map(item =>
                    item.jelo.id === jelo.id
                        ? {
                              ...item,
                              kolicina:
                                  item.kolicina + 1
                          }
                        : item
                )
            );
        } else {
            setKorpa([
                ...korpa,
                {
                    jelo,
                    kolicina: 1
                }
            ]);
        }
    };

    const povecajKolicinu = (id) => {
        setKorpa(
            korpa.map(item =>
                item.jelo.id === id
                    ? {
                          ...item,
                          kolicina:
                              item.kolicina + 1
                      }
                    : item
            )
        );
    };

    const smanjiKolicinu = (id) => {
        setKorpa(
            korpa
                .map(item =>
                    item.jelo.id === id
                        ? {
                              ...item,
                              kolicina:
                                  item.kolicina - 1
                          }
                        : item
                )
                .filter(item => item.kolicina > 0)
        );
    };

    const ukloniIzKorpe = (id) => {
        setKorpa(
            korpa.filter(
                item => item.jelo.id !== id
            )
        );
    };

    const rukujDodavanjemVrecice = (vrecica) => {
        console.log(
            'Dodata vrećica u korpu:',
            vrecica
        );

        if (
            !izabraniRestoran ||
            (
                izabraniRestoran.id !==
                    vrecica.restoran?.id &&
                izabraniRestoran.idKorisnika !==
                    vrecica.restoran?.idKorisnika
            )
        ) {
            setIzabraniRestoran(
                vrecica.restoran
            );
        }

        const vrecicaJelo = {
            id: `vrecica_${vrecica.id}`,
            naziv: `🎁 ${vrecica.naziv}`,
            cijena: vrecica.akcijskaCijena,
            opis: vrecica.opis
        };

        dodajUKorpu(vrecicaJelo);

        setPoruka(
            `Dodato u korpu: ${vrecica.naziv}`
        );

        setTimeout(() => {
            setPoruka('');
        }, 3000);
    };

    const ukupnaCijenaKorpe =
        korpa.reduce(
            (sum, item) =>
                sum +
                item.jelo.cijena *
                    item.kolicina,
            0
        );

    const brojArtikala =
        korpa.reduce(
            (sum, item) =>
                sum + item.kolicina,
            0
        );

    const posaljiNarudzbu = async (e) => {
        if (e) e.preventDefault();

        if (korpa.length === 0) {
            return alert(
                'Vaša korpa je prazna!'
            );
        }

        const kId =
            user?.id ||
            user?.idKorisnika;

        const rId =
            izabraniRestoran?.id ||
            izabraniRestoran?.idKorisnika;

        if (!kId || !rId) {
            alert(
                'Nedostaje ID kupca ili restorana!'
            );
            return;
        }

        const stavkeDTO = korpa.map(item => {
            const artikal =
                item.jelo ||
                item.vrecica ||
                item;

            let siroviId =
                artikal.id ||
                artikal.idJela ||
                artikal.vrecicaId;

            const jeVrecica =
                (
                    typeof siroviId ===
                        'string' &&
                    siroviId.includes(
                        'vrecica'
                    )
                ) ||
                artikal.akcijskaCijena !==
                    undefined;

            if (
                typeof siroviId ===
                    'string' &&
                siroviId.includes('_')
            ) {
                siroviId =
                    siroviId.split('_')[1];
            }

            const konvertovanId =
                Number(siroviId);

            const cijena =
                artikal.cijena ||
                artikal.akcijskaCijena ||
                0;

            return {
                jeloId:
                    !isNaN(
                        konvertovanId
                    )
                        ? konvertovanId
                        : null,

                tipStavke: jeVrecica
                    ? 'VRECICA'
                    : 'JELO',

                kolicina:
                    Number(
                        item.kolicina || 1
                    ),

                cijena:
                    Number(cijena)
            };
        });

        console.log(
            'Stavke sa tipom spremljene za backend:',
            stavkeDTO
        );

        const imaNevalidnih =
            stavkeDTO.some(
                s => s.jeloId === null
            );

        if (imaNevalidnih) {
            alert(
                'Greška: Jedan od artikala nema ispravan ID!'
            );
            return;
        }

        const dto = {
            kupacId:
                Number(kId),

            restoranId:
                Number(rId),

            adresaDostave:
                adresa ||
                'Preuzimanje u restoranu',

            ukupnaCijena:
                Number(
                    ukupnaCijenaKorpe
                ),

            stavke:
                stavkeDTO
        };

        try {
            await API.post(
                '/narudzbe',
                dto
            );

            alert(
                '🎉 Narudžba je uspešno poslata!'
            );

            setKorpa([]);
            setAdresa('');

            setOsveziNarudzbe(
                prev => prev + 1
            );
        } catch (err) {
            console.error(
                'Greška sa backenda:',
                err.response?.data ||
                    err.message
            );

            alert(
                `Greška prilikom slanja: ${
                    err.response?.data
                        ?.message ||
                    err.response?.data ||
                    err.message
                }`
            );
        }
    };

    const nazivRestorana =
        izabraniRestoran?.nazivObjekta ||
        izabraniRestoran?.korisnickoIme;

    // ==========================================
    // FILTRIRANI RESTORANI
    // ==========================================

    const filtriraniRestorani =
        restorani.filter(restoran => {
            const naziv =
                restoran.nazivObjekta ||
                restoran.korisnickoIme ||
                '';

            const opis =
                restoran.opis || '';

            const tekstPretrage =
                pretraga
                    .toLowerCase()
                    .trim();

            if (!tekstPretrage) {
                return true;
            }

            return (
                naziv
                    .toLowerCase()
                    .includes(
                        tekstPretrage
                    ) ||
                opis
                    .toLowerCase()
                    .includes(
                        tekstPretrage
                    )
            );
        });

    return (
        <div className="kupac-page">

            {/* =========================================
                NAVBAR
            ========================================= */}

            <header className="kupac-navbar">
                <div className="kupac-navbar-inner">

                    {/* BRAND */}

                    <div
                        className="brand"
                        onClick={
                            idiNaRestorane
                        }
                    >
                        <div className="brand-logo">
                            E
                        </div>

                        <div>
                            <div className="brand-name">
                                Eatery
                            </div>

                            <div className="brand-subtitle">
                                Food delivery
                            </div>
                        </div>
                    </div>

                    {/* NAVIGATION */}

                    <nav className="main-nav">

                        <button
                            onClick={
                                idiNaRestorane
                            }
                            className={
                                aktivnaStranica ===
                                    'restorani'
                                    ? 'nav-link active'
                                    : 'nav-link'
                            }
                        >
                            <span>⌂</span>
                            Restorani
                        </button>

                        {izabraniRestoran &&
                            aktivnaStranica ===
                                'restorani' && (
                                <button
                                    className="nav-link"
                                    onClick={() =>
                                        document
                                            .getElementById(
                                                'meni'
                                            )
                                            ?.scrollIntoView(
                                                {
                                                    behavior:
                                                        'smooth'
                                                }
                                            )
                                    }
                                >
                                    <span>
                                        ☷
                                    </span>
                                    Meni
                                </button>
                            )}

                        <button
                            className={
                                aktivnaStranica ===
                                    'narudzbe'
                                    ? 'nav-link active'
                                    : 'nav-link'
                            }
                            onClick={
                                idiNaNarudzbe
                            }
                        >
                            <span>◷</span>
                            Moje narudžbe
                        </button>

                    </nav>

                    {/* CART */}

                    <button
                        className="navbar-cart"
                        onClick={() => {
                            if (
                                izabraniRestoran
                            ) {
                                document
                                    .getElementById(
                                        'korpa'
                                    )
                                    ?.scrollIntoView(
                                        {
                                            behavior:
                                                'smooth'
                                        }
                                    );
                            } else {
                                alert(
                                    'Prvo izaberite restoran.'
                                );
                            }
                        }}
                    >
                        <span className="cart-icon">
                            🛒
                        </span>

                        <span>
                            Korpa
                        </span>

                        {brojArtikala >
                            0 && (
                            <span className="cart-badge">
                                {
                                    brojArtikala
                                }
                            </span>
                        )}
                    </button>

                </div>
            </header>

            {/* =========================================
                MAIN
            ========================================= */}

            <main className="kupac-content">

                {/* =========================================
                    NARUDŽBE — ZASEBAN PRIKAZ
                ========================================= */}

                {aktivnaStranica ===
                    'narudzbe' ? (

                    <section className="orders-page">

                        <div className="orders-page-top">

                            <button
                                className="back-button"
                                onClick={
                                    idiNaRestorane
                                }
                            >
                                <span>
                                    ←
                                </span>
                                Nazad na restorane
                            </button>

                        </div>

                        <div className="orders-heading">
                            <span className="section-label">
                                MOJA AKTIVNOST
                            </span>

                            <h1>
                                Moje narudžbe
                            </h1>

                            <p>
                                Pregledajte svoje
                                prethodne i trenutne
                                narudžbe.
                            </p>
                        </div>

                        <div className="orders-container">
                            <MojeNarudzbe
                                kupacId={
                                    user?.id ||
                                    user?.idKorisnika
                                }
                                key={
                                    osveziNarudzbe
                                }
                            />
                        </div>

                    </section>

                ) : (

                    /* =====================================
                       POČETNA / RESTORANI
                    ===================================== */

                    <>

                        {/* =================================
                            WELCOME
                        ================================= */}

                        {!izabraniRestoran && (
                            <section className="welcome-section">

                                <div className="welcome-text">

                                    <span className="eyebrow">
                                        DOBRODOŠLI NA EATERY
                                    </span>

                                    <h1>
                                        Zdravo,{' '}
                                        <span>
                                            {
                                                user?.ime ||
                                                user?.korisnickoIme ||
                                                'goste'
                                            }
                                        </span>
                                        !
                                    </h1>

                                    <p>
                                        Pronađite omiljeni
                                        restoran, izaberite
                                        jelo i uživajte u
                                        jednostavnoj kupovini.
                                    </p>

                                </div>

                                <div className="welcome-stats">

                                    <div className="mini-stat">
                                        <strong>
                                            {
                                                restorani.length
                                            }
                                        </strong>

                                        <span>
                                            restorana
                                        </span>
                                    </div>

                                    <div className="mini-stat-divider" />

                                    <div className="mini-stat">
                                        <strong>
                                            24/7
                                        </strong>

                                        <span>
                                            jednostavna kupovina
                                        </span>
                                    </div>

                                </div>

                            </section>
                        )}

                        {/* =================================
                            VRECICE
                        ================================= */}

                        {!izabraniRestoran && (
                            <section className="hero-vrecice-wrapper">

                                <HeroVrecice
                                    onDodajUVrecicu={
                                        rukujDodavanjemVrecice
                                    }
                                />

                            </section>
                        )}

                        {/* =================================
                            PORUKA
                        ================================= */}

                        {poruka && (
                            <div className="success-message">

                                <span className="success-icon">
                                    ✓
                                </span>

                                <span>
                                    {poruka}
                                </span>

                                <button
                                    onClick={() =>
                                        setPoruka('')
                                    }
                                >
                                    ×
                                </button>

                            </div>
                        )}

                        {/* =================================
                            RESTORANI
                        ================================= */}

                        {!izabraniRestoran ? (

                            <section className="restaurants-section">

                                <div className="section-heading restaurants-heading">

                                    <div>
                                        <span className="section-label">
                                            ISTRAŽITE PONUDU
                                        </span>

                                        <h2>
                                            Izaberite restoran
                                        </h2>

                                        <p>
                                            Odaberite restoran
                                            i pogledajte njihov
                                            meni.
                                        </p>
                                    </div>

                                    {/* PRETRAGA */}

                                    <div className="restaurant-search">

                                        <span className="search-icon">
                                            🔎
                                        </span>

                                        <input
                                            type="text"
                                            value={
                                                pretraga
                                            }
                                            onChange={e =>
                                                setPretraga(
                                                    e.target
                                                        .value
                                                )
                                            }
                                            placeholder="Pretraži restorane..."
                                        />

                                        {pretraga && (
                                            <button
                                                className="clear-search"
                                                onClick={() =>
                                                    setPretraga(
                                                        ''
                                                    )
                                                }
                                                aria-label="Obriši pretragu"
                                            >
                                                ×
                                            </button>
                                        )}

                                    </div>

                                </div>

                                {/* REZULTATI PRETRAGE */}

                                {restorani.length ===
                                0 ? (

                                    <div className="empty-state">

                                        <div className="empty-icon">
                                            🍽️
                                        </div>

                                        <h3>
                                            Trenutno nema restorana
                                        </h3>

                                        <p>
                                            Pokušajte ponovo
                                            kasnije.
                                        </p>

                                    </div>

                                ) : filtriraniRestorani.length ===
                                  0 ? (

                                    <div className="empty-state search-empty-state">

                                        <div className="empty-icon">
                                            🔎
                                        </div>

                                        <h3>
                                            Nema rezultata
                                        </h3>

                                        <p>
                                            Nijedan restoran
                                            ne odgovara
                                            pretrazi "
                                            {pretraga}
                                            ".
                                        </p>

                                        <button
                                            className="reset-search-button"
                                            onClick={() =>
                                                setPretraga(
                                                    ''
                                                )
                                            }
                                        >
                                            Prikaži sve restorane
                                        </button>

                                    </div>

                                ) : (

                                    <>

                                        {pretraga && (
                                            <div className="search-result-info">
                                                Pronađeno{' '}
                                                <strong>
                                                    {
                                                        filtriraniRestorani.length
                                                    }
                                                </strong>{' '}
                                                {filtriraniRestorani.length ===
                                                1
                                                    ? 'restoran'
                                                    : 'restorana'}
                                            </div>
                                        )}

                                        <div className="restaurant-grid">

                                            {filtriraniRestorani.map(
                                                r => (
                                                    <article
                                                        className="restaurant-card"
                                                        key={
                                                            r.id ||
                                                            r.idKorisnika
                                                        }
                                                        onClick={() =>
                                                            izaberiRestoran(
                                                                r
                                                            )
                                                        }
                                                    >

                                                        <div className="restaurant-cover">

                                                            <div className="restaurant-placeholder">
                                                                🍴
                                                            </div>

                                                            <div className="restaurant-status">
                                                                <span />
                                                                Otvoreno
                                                            </div>

                                                        </div>

                                                        <div className="restaurant-info">

                                                            <div className="restaurant-title-row">

                                                                <h3>
                                                                    {
                                                                        r.nazivObjekta ||
                                                                        r.korisnickoIme
                                                                    }
                                                                </h3>

                                                                <span className="restaurant-arrow">
                                                                    →
                                                                </span>

                                                            </div>

                                                            <p>
                                                                {r.opis ||
                                                                    'Ukusna hrana i kvalitetna usluga.'}
                                                            </p>

                                                            <div className="restaurant-meta">

                                                                <span>
                                                                    🍽️
                                                                </span>

                                                                <span>
                                                                    •
                                                                </span>

                                                                <span>
                                                                    Pregledajte meni
                                                                </span>

                                                            </div>

                                                            <button
                                                                className="restaurant-button"
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    izaberiRestoran(
                                                                        r
                                                                    );
                                                                }}
                                                            >
                                                                Pogledaj meni
                                                                <span>
                                                                    →
                                                                </span>
                                                            </button>

                                                        </div>

                                                    </article>
                                                )
                                            )}

                                        </div>

                                    </>
                                )}

                            </section>

                        ) : (

                            /* =================================
                               RESTORAN + MENI
                            ================================= */

                            <section
                                className="menu-layout-section"
                                id="meni"
                            >

                                <button
                                    className="back-button"
                                    onClick={() =>
                                        setIzabraniRestoran(
                                            null
                                        )
                                    }
                                >
                                    <span>
                                        ←
                                    </span>
                                    Svi restorani
                                </button>

                                <div className="restaurant-header">

                                    <div className="restaurant-header-icon">
                                        🍽️
                                    </div>

                                    <div>
                                        <span className="section-label">
                                            MENI RESTORANA
                                        </span>

                                        <h2>
                                            {
                                                nazivRestorana
                                            }
                                        </h2>

                                        <p>
                                            Izaberite jela
                                            koja želite
                                            dodati u svoju
                                            korpu.
                                        </p>
                                    </div>

                                    <div className="header-cart-info">

                                        <span>
                                            Vaša korpa
                                        </span>

                                        <strong>
                                            {
                                                brojArtikala
                                            }{' '}
                                            {brojArtikala ===
                                            1
                                                ? 'artikal'
                                                : 'artikala'}
                                        </strong>

                                    </div>

                                </div>

                                <div className="menu-content">

                                    {/* JELA */}

                                    <div className="food-list">

                                        <div className="food-list-heading">

                                            <div>
                                                <h3>
                                                    Ponuda jela
                                                </h3>

                                                <p>
                                                    {
                                                        jela.length
                                                    }{' '}
                                                    dostupnih
                                                    stavki
                                                </p>
                                            </div>

                                        </div>

                                        {jela.length ===
                                        0 ? (

                                            <div className="empty-state">

                                                <div className="empty-icon">
                                                    🍽️
                                                </div>

                                                <h3>
                                                    Meni je trenutno
                                                    prazan
                                                </h3>

                                                <p>
                                                    Ovaj restoran
                                                    trenutno nema
                                                    dostupnih jela.
                                                </p>

                                            </div>

                                        ) : (

                                            <div className="food-items">

                                                {jela.map(
                                                    j => (
                                                        <article
                                                            className="food-card"
                                                            key={
                                                                j.id ||
                                                                j.idJela
                                                            }
                                                        >

                                                            <div className="food-image">
                                                                🍽
                                                            </div>

                                                            <div className="food-details">

                                                                <h4>
                                                                    {
                                                                        j.naziv
                                                                    }
                                                                </h4>

                                                                <p>
                                                                    {j.opis ||
                                                                        'Ukusno pripremljeno jelo.'}
                                                                </p>

                                                                <strong className="food-price">
                                                                    {Number(
                                                                        j.cijena
                                                                    ).toFixed(
                                                                        2
                                                                    )}{' '}
                                                                    KM
                                                                </strong>

                                                            </div>

                                                            <button
                                                                className="add-food-button"
                                                                onClick={() =>
                                                                    dodajUKorpu(
                                                                        j
                                                                    )
                                                                }
                                                            >
                                                                <span>
                                                                    +
                                                                </span>
                                                                Dodaj
                                                            </button>

                                                        </article>
                                                    )
                                                )}

                                            </div>
                                        )}

                                    </div>

                                    {/* =================================
                                        KORPA
                                    ================================= */}

                                    <aside
                                        className="cart-card"
                                        id="korpa"
                                    >

                                        <div className="cart-header">

                                            <div>

                                                <span className="cart-header-icon">
                                                    🛒
                                                </span>

                                                <div>

                                                    <h3>
                                                        Vaša korpa
                                                    </h3>

                                                    <p>
                                                        {brojArtikala ===
                                                        0
                                                            ? 'Nema artikala'
                                                            : `${brojArtikala} ${
                                                                  brojArtikala ===
                                                                  1
                                                                      ? 'artikal'
                                                                      : 'artikala'
                                                              }`}
                                                    </p>

                                                </div>

                                            </div>

                                            {korpa.length >
                                                0 && (
                                                <button
                                                    className="clear-cart"
                                                    onClick={() =>
                                                        setKorpa(
                                                            []
                                                        )
                                                    }
                                                >
                                                    Očisti
                                                </button>
                                            )}

                                        </div>

                                        {korpa.length ===
                                        0 ? (

                                            <div className="empty-cart">

                                                <div className="empty-cart-icon">
                                                    🛍️
                                                </div>

                                                <h4>
                                                    Korpa je prazna
                                                </h4>

                                                <p>
                                                    Dodajte nešto
                                                    iz menija i
                                                    ovdje ćete
                                                    vidjeti svoju
                                                    narudžbu.
                                                </p>

                                            </div>

                                        ) : (

                                            <>

                                                <div className="cart-items">

                                                    {korpa.map(
                                                        item => (
                                                            <div
                                                                className="cart-item"
                                                                key={
                                                                    item
                                                                        .jelo
                                                                        .id
                                                                }
                                                            >

                                                                <div className="cart-item-main">

                                                                    <div className="cart-item-icon">
                                                                        {item.jelo.naziv.startsWith(
                                                                            '🎁'
                                                                        )
                                                                            ? '🎁'
                                                                            : '🍴'}
                                                                    </div>

                                                                    <div className="cart-item-info">

                                                                        <h4>
                                                                            {
                                                                                item
                                                                                    .jelo
                                                                                    .naziv
                                                                            }
                                                                        </h4>

                                                                        <span>
                                                                            {Number(
                                                                                item
                                                                                    .jelo
                                                                                    .cijena
                                                                            ).toFixed(
                                                                                2
                                                                            )}{' '}
                                                                            KM
                                                                        </span>

                                                                    </div>

                                                                </div>

                                                                <div className="cart-item-bottom">

                                                                    <div className="quantity-control">

                                                                        <button
                                                                            onClick={() =>
                                                                                smanjiKolicinu(
                                                                                    item
                                                                                        .jelo
                                                                                        .id
                                                                                )
                                                                            }
                                                                        >
                                                                            −
                                                                        </button>

                                                                        <strong>
                                                                            {
                                                                                item.kolicina
                                                                            }
                                                                        </strong>

                                                                        <button
                                                                            onClick={() =>
                                                                                povecajKolicinu(
                                                                                    item
                                                                                        .jelo
                                                                                        .id
                                                                                )
                                                                            }
                                                                        >
                                                                            +
                                                                        </button>

                                                                    </div>

                                                                    <strong>
                                                                        {(
                                                                            item
                                                                                .jelo
                                                                                .cijena *
                                                                            item.kolicina
                                                                        ).toFixed(
                                                                            2
                                                                        )}{' '}
                                                                        KM
                                                                    </strong>

                                                                </div>

                                                                <button
                                                                    className="remove-item"
                                                                    onClick={() =>
                                                                        ukloniIzKorpe(
                                                                            item
                                                                                .jelo
                                                                                .id
                                                                        )
                                                                    }
                                                                >
                                                                    Ukloni
                                                                </button>

                                                            </div>
                                                        )
                                                    )}

                                                </div>

                                                <div className="cart-summary">

                                                    <div className="summary-line">

                                                        <span>
                                                            Međuzbir
                                                        </span>

                                                        <strong>
                                                            {ukupnaCijenaKorpe.toFixed(
                                                                2
                                                            )}{' '}
                                                            KM
                                                        </strong>

                                                    </div>

                                                    <div className="summary-line">

                                                        <span>
                                                            Dostava
                                                        </span>

                                                        <span className="free-delivery">
                                                            Besplatno
                                                        </span>

                                                    </div>

                                                    <div className="summary-total">

                                                        <span>
                                                            Ukupno
                                                        </span>

                                                        <strong>
                                                            {ukupnaCijenaKorpe.toFixed(
                                                                2
                                                            )}{' '}
                                                            KM
                                                        </strong>

                                                    </div>

                                                </div>

                                                <form
                                                    className="order-form"
                                                    onSubmit={
                                                        posaljiNarudzbu
                                                    }
                                                >

                                                    <label>
                                                        Adresa dostave
                                                    </label>

                                                    <input
                                                        type="text"
                                                        placeholder="Unesite adresu dostave..."
                                                        value={
                                                            adresa
                                                        }
                                                        onChange={e =>
                                                            setAdresa(
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        required
                                                    />

                                                    <button
                                                        type="submit"
                                                        className="order-button"
                                                    >
                                                        Potvrdi i naruči
                                                        <span>
                                                            →
                                                        </span>
                                                    </button>

                                                    <small>
                                                        🔒 Sigurna narudžba
                                                    </small>

                                                </form>

                                            </>
                                        )}

                                    </aside>

                                </div>

                            </section>
                        )}

                    </>
                )}

            </main>

            {/* =========================================
                FOOTER
            ========================================= */}

            <footer className="kupac-footer">

                <div>

                    <strong>
                        Eatery
                    </strong>

                    <span>
                        © 2026 — Vaša hrana, na vašim vratima.
                    </span>

                </div>

                <span>
                    Uživajte u svakom zalogaju. 🍽️
                </span>

            </footer>

        </div>
    );
}

export default KupacPanel;