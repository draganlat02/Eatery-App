import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RestoranPanel.css";

const RestoranPanel = ({ restoranId, user }) => {

    // =========================================================
    // ID RESTORANA
    // =========================================================

    const stvarniRestoranId =
        restoranId ||
        user?.id ||
        user?.idKorisnika;


    // =========================================================
    // STANJA
    // =========================================================

    const [vrecice, setVrecice] = useState([]);
    const [narudzbe, setNarudzbe] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingNarudzbe, setLoadingNarudzbe] = useState(false);

    const [kategorije, setKategorije] = useState([]);
    const [jela, setJela] = useState([]);

    const [novaKategorija, setNovaKategorija] = useState("");

    const [novoJelo, setNovoJelo] = useState({
        naziv: "",
        opis: "",
        cijena: "",
        kategorijaId: ""
    });


    // =========================================================
    // NAVIGACIJA
    // =========================================================

    const [aktivnaSekcija, setAktivnaSekcija] =
        useState("pocetna");


    // =========================================================
    // FORMA ZA VREĆICU
    // =========================================================

    const pocetnaForma = {
        naziv: "Vrećica Iznenađenja",
        opis:
            "Ukusna kombinacija naših današnjih specijaliteta po akcijskoj cijeni!",
        originalnaCijena: "",
        akcijskaCijena: "",
        kolicina: 1,
        vrijemePreuzimanjaOd: "20:00",
        vrijemePreuzimanjaDo: "21:30",
        aktivna: true
    };

    const [forma, setForma] = useState(pocetnaForma);


    // =========================================================
    // UČITAVANJE VREĆICA
    // =========================================================

    const ucitajVrecice = async () => {

        if (!stvarniRestoranId) return;

        try {

            setLoading(true);

            const res = await axios.get(
                `http://localhost:8000/api/vrecice/restoran/${stvarniRestoranId}`
            );

            setVrecice(res.data);

        } catch (err) {

            console.error(
                "Greška pri učitavanju vrećica:",
                err
            );

        } finally {

            setLoading(false);
        }
    };


    // =========================================================
    // UČITAVANJE NARUDŽBI
    // =========================================================

    const ucitajNarudzbe = async () => {

        if (!stvarniRestoranId) return;

        try {

            setLoadingNarudzbe(true);

            const res = await axios.get(
                `http://localhost:8000/api/restoran/${stvarniRestoranId}/narudzbe`
            );

            setNarudzbe(res.data);

        } catch (err) {

            console.error(
                "Greška pri učitavanju narudžbi:",
                err
            );

        } finally {

            setLoadingNarudzbe(false);
        }
    };


    // =========================================================
    // UČITAVANJE KATEGORIJA I JELA
    // =========================================================

    const ucitajKategorijeIJela = async () => {

        if (!stvarniRestoranId) return;

        try {

            const resKat = await axios.get(
                `http://localhost:8000/api/restoran/${stvarniRestoranId}/kategorije`
            );

            setKategorije(resKat.data);

            if (resKat.data.length > 0) {

                setNovoJelo(prev => ({
                    ...prev,
                    kategorijaId: resKat.data[0].id
                }));
            }


            const resJela = await axios.get(
                `http://localhost:8000/api/restoran/${stvarniRestoranId}/jela`
            );

            setJela(resJela.data);

        } catch (err) {

            console.error(
                "Greška pri učitavanju kategorija/jela:",
                err
            );
        }
    };


    // =========================================================
    // INICIJALNO UČITAVANJE
    // =========================================================

    useEffect(() => {

        if (stvarniRestoranId) {

            ucitajVrecice();
            ucitajNarudzbe();
            ucitajKategorijeIJela();
        }

    }, [stvarniRestoranId]);


    // =========================================================
    // POLLING NARUDŽBI - 5 SEKUNDI
    // =========================================================

    useEffect(() => {

        if (!stvarniRestoranId) return;

        const intervalId = setInterval(() => {

            ucitajNarudzbe();

        }, 5000);

        return () => clearInterval(intervalId);

    }, [stvarniRestoranId]);


    // =========================================================
    // NAVIGACIJA
    // =========================================================

    const idiNaSekciju = (sekcija, id) => {

        setAktivnaSekcija(sekcija);

        setTimeout(() => {

            document
                .getElementById(id)
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

        }, 50);
    };


    // =========================================================
    // DODAVANJE KATEGORIJE
    // =========================================================

    const handleDodajKategoriju = async (e) => {

        e.preventDefault();

        if (!novaKategorija.trim()) return;

        try {

            await axios.post(
                `http://localhost:8000/api/restoran/${stvarniRestoranId}/kategorije`,
                {
                    naziv: novaKategorija
                }
            );

            alert("Kategorija uspešno dodata!");

            setNovaKategorija("");

            ucitajKategorijeIJela();

        } catch (err) {

            console.error(
                "Greška pri dodavanju kategorije:",
                err
            );

            alert("Greška pri dodavanju kategorije.");
        }
    };


    // =========================================================
    // DODAVANJE JELA
    // =========================================================

    const handleDodajJelo = async (e) => {

        e.preventDefault();

        if (
            !novoJelo.naziv ||
            !novoJelo.cijena ||
            !novoJelo.kategorijaId
        ) {

            alert(
                "Molimo popunite sva obavezna polja za jelo!"
            );

            return;
        }

        try {

            await axios.post(
                `http://localhost:8000/api/restoran/${stvarniRestoranId}/jela`,
                {
                    naziv: novoJelo.naziv,
                    opis: novoJelo.opis,
                    cijena: parseFloat(novoJelo.cijena),
                    kategorijaId:
                        parseInt(
                            novoJelo.kategorijaId,
                            10
                        )
                }
            );

            alert("Jelo uspešno dodato na meni!");

            setNovoJelo({
                naziv: "",
                opis: "",
                cijena: "",
                kategorijaId:
                    kategorije[0]?.id || ""
            });

            ucitajKategorijeIJela();

        } catch (err) {

            console.error(
                "Greška pri dodavanju jela:",
                err
            );

            alert("Greška pri dodavanju jela.");
        }
    };


    // =========================================================
    // FORMA VREĆICE
    // =========================================================

    const handleChange = (e) => {

        const {
            name,
            value,
            type,
            checked
        } = e.target;

        setForma({
            ...forma,
            [name]:
                type === "checkbox"
                    ? checked
                    : value
        });
    };


    // =========================================================
    // KREIRANJE VREĆICE
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!stvarniRestoranId) {

            alert(
                "Greška: Nije pronađen ID restorana!"
            );

            return;
        }

        const payload = {

            naziv: forma.naziv,

            opis: forma.opis,

            originalnaCijena:
                parseFloat(
                    forma.originalnaCijena
                ),

            akcijskaCijena:
                parseFloat(
                    forma.akcijskaCijena
                ),

            kolicina:
                parseInt(
                    forma.kolicina,
                    10
                ),

            vrijemePreuzimanjaOd:
                forma.vrijemePreuzimanjaOd,

            vrijemePreuzimanjaDo:
                forma.vrijemePreuzimanjaDo,

            aktivna: forma.aktivna
        };

        try {

            await axios.post(
                `http://localhost:8000/api/vrecice/restoran/${stvarniRestoranId}`,
                payload
            );

            alert(
                "🎉 Vrećica iznenađenja je uspešno kreirana!"
            );

            setForma(pocetnaForma);

            ucitajVrecice();

        } catch (err) {

            console.error(
                "Greška pri kreiranju vrećice:",
                err
            );

            alert(
                "Greška prilikom kreiranja vrećice."
            );
        }
    };


    // =========================================================
    // PROMJENA STATUSA VREĆICE
    // =========================================================

    const PromijeniStatus = async (
        vrecicaId,
        trenutniStatus
    ) => {

        try {

            await axios.put(
                `http://localhost:8000/api/vrecice/${vrecicaId}/status?aktivna=${!trenutniStatus}`
            );

            ucitajVrecice();

        } catch (err) {

            console.error(
                "Greška pri promjeni statusa vrećice:",
                err
            );
        }
    };


    // =========================================================
    // PROMJENA KOLIČINE VREĆICE
    // =========================================================

    const azurirajKolicinu = async (
        vrecicaId,
        novaKolicina
    ) => {

        if (novaKolicina < 0) return;

        try {

            await axios.put(
                `http://localhost:8000/api/vrecice/${vrecicaId}/kolicina?kolicina=${novaKolicina}`
            );

            ucitajVrecice();

        } catch (err) {

            console.error(
                "Greška pri ažuriranju količine:",
                err
            );
        }
    };


    // =========================================================
    // PROMJENA STATUSA NARUDŽBE
    // =========================================================

    const PromijeniStatusNarudzbe = async (
        narudzbaId,
        noviStatus
    ) => {

        try {

            await axios.put(
                `http://localhost:8000/api/restoran/narudzba/${narudzbaId}/status`,
                noviStatus,
                {
                    headers: {
                        "Content-Type":
                            "text/plain"
                    }
                }
            );

            ucitajNarudzbe();

        } catch (err) {

            console.error(
                "Greška pri promjeni statusa narudžbe:",
                err
            );
        }
    };


    // =========================================================
    // BROJ NOVIH NARUDŽBI
    // =========================================================

    const noveNarudzbeBroj =
        narudzbe.filter(
            n =>
                !n.status ||
                n.status === "ZAPRIMLJENO"
        ).length;


    // =========================================================
    // STATISTIKA
    // =========================================================

    const brojJela = jela.length;

    const brojKategorija =
        kategorije.length;

    const brojVrecica =
        vrecice.length;


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="restoran-page">


            {/* =================================================
                NAVBAR
            ================================================= */}

            <header className="restoran-navbar">

                <div className="restoran-navbar-inner">


                    {/* BRAND */}

                    <div
                        className="restoran-brand"
                        onClick={() =>
                            idiNaSekciju(
                                "pocetna",
                                "pocetna"
                            )
                        }
                    >

                        <div className="restoran-brand-logo">
                            E
                        </div>

                        <div>

                            <div className="restoran-brand-name">
                                Eatery
                            </div>

                            <div className="restoran-brand-subtitle">
                                Restaurant
                            </div>

                        </div>

                    </div>


                    {/* NAV */}

                    <nav className="restoran-main-nav">

                        <button
                            className={
                                aktivnaSekcija === "pocetna"
                                    ? "restoran-nav-link active"
                                    : "restoran-nav-link"
                            }
                            onClick={() =>
                                idiNaSekciju(
                                    "pocetna",
                                    "pocetna"
                                )
                            }
                        >
                            <span>⌂</span>
                            Početna
                        </button>


                        <button
                            className={
                                aktivnaSekcija === "narudzbe"
                                    ? "restoran-nav-link active"
                                    : "restoran-nav-link"
                            }
                            onClick={() =>
                                idiNaSekciju(
                                    "narudzbe",
                                    "narudzbe"
                                )
                            }
                        >
                            <span>◷</span>
                            Narudžbe

                            {noveNarudzbeBroj > 0 && (
                                <b className="nav-order-badge">
                                    {noveNarudzbeBroj}
                                </b>
                            )}
                        </button>


                        <button
                            className={
                                aktivnaSekcija === "meni"
                                    ? "restoran-nav-link active"
                                    : "restoran-nav-link"
                            }
                            onClick={() =>
                                idiNaSekciju(
                                    "meni",
                                    "meni"
                                )
                            }
                        >
                            <span>☷</span>
                            Meni
                        </button>


                        <button
                            className={
                                aktivnaSekcija === "vrecice"
                                    ? "restoran-nav-link active"
                                    : "restoran-nav-link"
                            }
                            onClick={() =>
                                idiNaSekciju(
                                    "vrecice",
                                    "vrecice"
                                )
                            }
                        >
                            <span>🎁</span>
                            Vrećice
                        </button>

                    </nav>


                    {/* ID / RESTORAN */}

                    <div className="restaurant-id-box">

                        <span>
                            Restoran
                        </span>

                        <strong>
                            #{stvarniRestoranId || "—"}
                        </strong>

                    </div>

                </div>

            </header>


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="restoran-content">


                {/* =================================================
                    HERO / POČETNA
                ================================================= */}

                <section
                    className="restaurant-welcome"
                    id="pocetna"
                >

                    <div>

                        <span className="restaurant-eyebrow">
                            EATERY RESTORAN
                        </span>

                        <h1>
                            Dobrodošli,
                            <span>
                                {" "}
                                {user?.korisnickoIme ||
                                    user?.ime ||
                                    "restorane"}
                            </span>
                            !
                        </h1>

                        <p>
                            Upravljajte svojim restoranom,
                            narudžbama, menijem i vrećicama
                            iznenađenja na jednom mjestu.
                        </p>

                    </div>


                    <div className="restaurant-stats">

                        <div className="restaurant-mini-stat">

                            <strong>
                                {noveNarudzbeBroj}
                            </strong>

                            <span>
                                nove narudžbe
                            </span>

                        </div>


                        <div className="restaurant-stat-divider" />


                        <div className="restaurant-mini-stat">

                            <strong>
                                {brojJela}
                            </strong>

                            <span>
                                jela na meniju
                            </span>

                        </div>


                        <div className="restaurant-stat-divider" />


                        <div className="restaurant-mini-stat">

                            <strong>
                                {brojVrecica}
                            </strong>

                            <span>
                                vrećica
                            </span>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    DIJAGNOSTIKA
                ================================================= */}

                {!stvarniRestoranId && (

                    <div className="restaurant-error">

                        <div className="restaurant-error-icon">
                            !
                        </div>

                        <div>

                            <strong>
                                Nije pronađen ID restorana
                            </strong>

                            <p>
                                Provjerite da li se
                                restoranId ili korisnički ID
                                pravilno prosljeđuje komponenti.
                            </p>

                        </div>

                    </div>

                )}


                {/* =================================================
                    NARUDŽBE
                ================================================= */}

                <section
                    className="restaurant-section"
                    id="narudzbe"
                >

                    <div className="restaurant-section-heading">

                        <div>

                            <span className="section-label">
                                AKTIVNOST RESTORANA
                            </span>

                            <h2>
                                Primljene narudžbe
                            </h2>

                            <p>
                                Pregledajte i ažurirajte
                                status pristiglih narudžbi.
                            </p>

                        </div>


                        <button
                            className="outline-action"
                            onClick={ucitajNarudzbe}
                            disabled={loadingNarudzbe}
                        >
                            <span>
                                ↻
                            </span>

                            {loadingNarudzbe
                                ? "Osvježavanje..."
                                : "Osvježi"}
                        </button>

                    </div>


                    <div className="orders-panel">

                        <div className="orders-panel-top">

                            <div>

                                <span className="panel-icon">
                                    📋
                                </span>

                                <div>

                                    <h3>
                                        Narudžbe
                                    </h3>

                                    <p>
                                        {narudzbe.length === 0
                                            ? "Trenutno nema narudžbi"
                                            : `${narudzbe.length} ukupno`}
                                    </p>

                                </div>

                            </div>


                            {noveNarudzbeBroj > 0 && (

                                <div className="new-orders-indicator">

                                    <span />

                                    {noveNarudzbeBroj}
                                    {" "}
                                    {noveNarudzbeBroj === 1
                                        ? "nova"
                                        : "novih"}

                                </div>

                            )}

                        </div>


                        {loadingNarudzbe &&
                        narudzbe.length === 0 ? (

                            <div className="restaurant-empty">

                                <div className="restaurant-empty-icon">
                                    ◌
                                </div>

                                <h3>
                                    Učitavanje narudžbi...
                                </h3>

                            </div>

                        ) : narudzbe.length === 0 ? (

                            <div className="restaurant-empty">

                                <div className="restaurant-empty-icon">
                                    📭
                                </div>

                                <h3>
                                    Nema pristiglih narudžbi
                                </h3>

                                <p>
                                    Kada kupac pošalje
                                    narudžbu, ona će se
                                    pojaviti ovdje.
                                </p>

                            </div>

                        ) : (

                            <div className="orders-list">

                                {narudzbe.map(n => (

                                    <article
                                        className="order-card"
                                        key={n.id}
                                    >

                                        <div className="order-card-header">

                                            <div>

                                                <span className="order-number-label">
                                                    NARUDŽBA
                                                </span>

                                                <h3>
                                                    #{n.id}
                                                </h3>

                                            </div>


                                            <div
                                                className={`order-status ${
                                                    !n.status ||
                                                    n.status ===
                                                        "ZAPRIMLJENO"
                                                        ? "received"
                                                        : n.status ===
                                                          "U_PRIPREMI"
                                                        ? "preparing"
                                                        : n.status ===
                                                          "SPREMNO"
                                                        ? "ready"
                                                        : "delivered"
                                                }`}
                                            >

                                                <span />

                                                {n.status ||
                                                    "ZAPRIMLJENO"}

                                            </div>

                                        </div>


                                        <div className="order-card-body">

                                            <div className="order-info">

                                                <span>
                                                    📍 Adresa
                                                </span>

                                                <strong>
                                                    {n.adresaDostave ||
                                                        "Nije navedena"}
                                                </strong>

                                            </div>


                                            <div className="order-info">

                                                <span>
                                                    💰 Ukupna cijena
                                                </span>

                                                <strong className="order-price">
                                                    {Number(
                                                        n.ukupnaCijena ||
                                                            0
                                                    ).toFixed(2)}
                                                    {" "}
                                                    KM
                                                </strong>

                                            </div>

                                        </div>


                                        <div className="order-card-actions">

                                            <span className="action-label">
                                                Promijeni status:
                                            </span>


                                            <div className="status-buttons">

                                                <button
                                                    className={
                                                        n.status ===
                                                        "U_PRIPREMI"
                                                            ? "status-button selected"
                                                            : "status-button"
                                                    }
                                                    onClick={() =>
                                                        PromijeniStatusNarudzbe(
                                                            n.id,
                                                            "U_PRIPREMI"
                                                        )
                                                    }
                                                >
                                                    U pripremi
                                                </button>


                                                <button
                                                    className={
                                                        n.status ===
                                                        "SPREMNO"
                                                            ? "status-button selected"
                                                            : "status-button"
                                                    }
                                                    onClick={() =>
                                                        PromijeniStatusNarudzbe(
                                                            n.id,
                                                            "SPREMNO"
                                                        )
                                                    }
                                                >
                                                    Spremno
                                                </button>


                                                <button
                                                    className={
                                                        n.status ===
                                                        "DOSTAVLJENO"
                                                            ? "status-button selected"
                                                            : "status-button"
                                                    }
                                                    onClick={() =>
                                                        PromijeniStatusNarudzbe(
                                                            n.id,
                                                            "DOSTAVLJENO"
                                                        )
                                                    }
                                                >
                                                    Dostavljeno
                                                </button>

                                            </div>

                                        </div>

                                    </article>

                                ))}

                            </div>

                        )}

                    </div>

                </section>


                {/* =================================================
                    MENI
                ================================================= */}

                <section
                    className="restaurant-section"
                    id="meni"
                >

                    <div className="restaurant-section-heading">

                        <div>

                            <span className="section-label">
                                PONUDA RESTORANA
                            </span>

                            <h2>
                                Upravljanje menijem
                            </h2>

                            <p>
                                Organizujte kategorije i
                                dodajte nova jela u ponudu.
                            </p>

                        </div>

                    </div>


                    <div className="menu-management-grid">


                        {/* KATEGORIJA */}

                        <div className="management-card">

                            <div className="management-card-heading">

                                <div className="management-icon">
                                    ☷
                                </div>

                                <div>

                                    <h3>
                                        Nova kategorija
                                    </h3>

                                    <p>
                                        Organizujte ponudu
                                        restorana.
                                    </p>

                                </div>

                            </div>


                            <form
                                onSubmit={
                                    handleDodajKategoriju
                                }
                                className="styled-form"
                            >

                                <label>
                                    Naziv kategorije
                                </label>

                                <input
                                    type="text"
                                    placeholder="npr. Pizze"
                                    value={
                                        novaKategorija
                                    }
                                    onChange={e =>
                                        setNovaKategorija(
                                            e.target.value
                                        )
                                    }
                                    required
                                />


                                <button
                                    type="submit"
                                    className="primary-button"
                                >
                                    <span>+</span>
                                    Dodaj kategoriju
                                </button>

                            </form>


                            <div className="existing-categories">

                                <div className="sub-heading">

                                    <strong>
                                        Postojeće kategorije
                                    </strong>

                                    <span>
                                        {brojKategorija}
                                    </span>

                                </div>


                                {kategorije.length === 0 ? (

                                    <p className="muted-text">
                                        Još nema kategorija.
                                    </p>

                                ) : (

                                    <div className="category-list">

                                        {kategorije.map(kat => (

                                            <div
                                                className="category-chip"
                                                key={kat.id}
                                            >

                                                <span>
                                                    {kat.naziv}
                                                </span>

                                            </div>

                                        ))}

                                    </div>

                                )}

                            </div>

                        </div>


                        {/* JELA */}

                        <div className="management-card">

                            <div className="management-card-heading">

                                <div className="management-icon">
                                    🍽️
                                </div>

                                <div>

                                    <h3>
                                        Novo jelo
                                    </h3>

                                    <p>
                                        Dodajte jelo na
                                        svoj meni.
                                    </p>

                                </div>

                            </div>


                            <form
                                onSubmit={
                                    handleDodajJelo
                                }
                                className="styled-form"
                            >

                                <label>
                                    Kategorija
                                </label>

                                <select
                                    value={
                                        novoJelo.kategorijaId
                                    }
                                    onChange={e =>
                                        setNovoJelo({
                                            ...novoJelo,
                                            kategorijaId:
                                                e.target.value
                                        })
                                    }
                                    required
                                >

                                    <option value="">
                                        -- Izaberi kategoriju --
                                    </option>

                                    {kategorije.map(kat => (

                                        <option
                                            key={kat.id}
                                            value={kat.id}
                                        >
                                            {kat.naziv}
                                        </option>

                                    ))}

                                </select>


                                <label>
                                    Naziv jela
                                </label>

                                <input
                                    type="text"
                                    placeholder="npr. Pizza Margherita"
                                    value={
                                        novoJelo.naziv
                                    }
                                    onChange={e =>
                                        setNovoJelo({
                                            ...novoJelo,
                                            naziv:
                                                e.target.value
                                        })
                                    }
                                    required
                                />


                                <label>
                                    Opis / sastojci
                                </label>

                                <textarea
                                    placeholder="Kratak opis jela..."
                                    rows="3"
                                    value={
                                        novoJelo.opis
                                    }
                                    onChange={e =>
                                        setNovoJelo({
                                            ...novoJelo,
                                            opis:
                                                e.target.value
                                        })
                                    }
                                />


                                <label>
                                    Cijena (KM)
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={
                                        novoJelo.cijena
                                    }
                                    onChange={e =>
                                        setNovoJelo({
                                            ...novoJelo,
                                            cijena:
                                                e.target.value
                                        })
                                    }
                                    required
                                />


                                <button
                                    type="submit"
                                    className="primary-button"
                                >
                                    <span>+</span>
                                    Sačuvaj jelo
                                </button>

                            </form>

                        </div>

                    </div>


                    {/* POSTOJEĆI MENI */}

                    <div className="existing-menu-card">

                        <div className="existing-menu-heading">

                            <div>

                                <span className="section-label">
                                    TRENUTNA PONUDA
                                </span>

                                <h3>
                                    Postojeći meni
                                </h3>

                                <p>
                                    Sva jela koja su trenutno
                                    dostupna na meniju.
                                </p>

                            </div>


                            <div className="menu-count">

                                <strong>
                                    {brojJela}
                                </strong>

                                <span>
                                    jela
                                </span>

                            </div>

                        </div>


                        {jela.length === 0 ? (

                            <div className="restaurant-empty">

                                <div className="restaurant-empty-icon">
                                    🍽️
                                </div>

                                <h3>
                                    Meni je trenutno prazan
                                </h3>

                                <p>
                                    Dodajte prvo jelo
                                    koristeći formu iznad.
                                </p>

                            </div>

                        ) : (

                            <div className="menu-items-grid">

                                {jela.map(jelo => (

                                    <article
                                        className="menu-item-card"
                                        key={jelo.id}
                                    >

                                        <div className="menu-item-image">
                                            🍽️
                                        </div>


                                        <div className="menu-item-content">

                                            <div className="menu-item-top">

                                                <h4>
                                                    {jelo.naziv}
                                                </h4>

                                                <strong>
                                                    {Number(
                                                        jelo.cijena ||
                                                            0
                                                    ).toFixed(2)}
                                                    {" "}
                                                    KM
                                                </strong>

                                            </div>


                                            <p>
                                                {jelo.opis ||
                                                    "Ukusno pripremljeno jelo."}
                                            </p>

                                        </div>

                                    </article>

                                ))}

                            </div>

                        )}

                    </div>

                </section>


                {/* =================================================
                    VREĆICE
                ================================================= */}

                <section
                    className="restaurant-section"
                    id="vrecice"
                >

                    <div className="restaurant-section-heading">

                        <div>

                            <span className="section-label">
                                SPASITE HRANU
                            </span>

                            <h2>
                                Vrećice iznenađenja
                            </h2>

                            <p>
                                Kreirajte i upravljajte
                                svojim ponudama.
                            </p>

                        </div>

                    </div>


                    {/* FORMA */}

                    <div className="bag-create-card">

                        <div className="bag-create-intro">

                            <div className="bag-big-icon">
                                🎁
                            </div>

                            <div>

                                <span className="section-label">
                                    NOVA PONUDA
                                </span>

                                <h3>
                                    Objavi vrećicu
                                </h3>

                                <p>
                                    Ponudite višak hrane
                                    kupcima po akcijskoj
                                    cijeni.
                                </p>

                            </div>

                        </div>


                        <form
                            onSubmit={handleSubmit}
                            className="bag-form"
                        >

                            <div className="form-field full">

                                <label>
                                    Naziv vrećice
                                </label>

                                <input
                                    type="text"
                                    name="naziv"
                                    value={
                                        forma.naziv
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <div className="form-field full">

                                <label>
                                    Opis
                                </label>

                                <textarea
                                    name="opis"
                                    rows="3"
                                    value={
                                        forma.opis
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>


                            <div className="bag-form-row">

                                <div className="form-field">

                                    <label>
                                        Originalna cijena (KM)
                                    </label>

                                    <input
                                        type="number"
                                        step="0.01"
                                        name="originalnaCijena"
                                        value={
                                            forma.originalnaCijena
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />

                                </div>


                                <div className="form-field">

                                    <label>
                                        Akcijska cijena (KM)
                                    </label>

                                    <input
                                        type="number"
                                        step="0.01"
                                        name="akcijskaCijena"
                                        value={
                                            forma.akcijskaCijena
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />

                                </div>


                                <div className="form-field">

                                    <label>
                                        Količina
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        name="kolicina"
                                        value={
                                            forma.kolicina
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />

                                </div>

                            </div>


                            <div className="bag-form-row">

                                <div className="form-field">

                                    <label>
                                        Preuzimanje od
                                    </label>

                                    <input
                                        type="time"
                                        name="vrijemePreuzimanjaOd"
                                        value={
                                            forma.vrijemePreuzimanjaOd
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>


                                <div className="form-field">

                                    <label>
                                        Preuzimanje do
                                    </label>

                                    <input
                                        type="time"
                                        name="vrijemePreuzimanjaDo"
                                        value={
                                            forma.vrijemePreuzimanjaDo
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>


                                <div className="form-field checkbox-field">

                                    <label className="checkbox-label">

                                        <input
                                            type="checkbox"
                                            name="aktivna"
                                            checked={
                                                forma.aktivna
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                        <span>
                                            Aktivna odmah
                                        </span>

                                    </label>

                                </div>

                            </div>


                            <button
                                type="submit"
                                className="primary-button bag-submit"
                            >
                                <span>🎁</span>
                                Objavi vrećicu
                            </button>

                        </form>

                    </div>


                    {/* POSTOJEĆE VREĆICE */}

                    <div className="published-bags">

                        <div className="existing-menu-heading">

                            <div>

                                <span className="section-label">
                                    VAŠE PONUDE
                                </span>

                                <h3>
                                    Objavljene vrećice
                                </h3>

                                <p>
                                    Upravljajte količinom i
                                    statusom svojih vrećica.
                                </p>

                            </div>


                            <div className="menu-count">

                                <strong>
                                    {brojVrecica}
                                </strong>

                                <span>
                                    vrećica
                                </span>

                            </div>

                        </div>


                        {loading && vrecice.length === 0 ? (

                            <div className="restaurant-empty">

                                <div className="restaurant-empty-icon">
                                    ◌
                                </div>

                                <h3>
                                    Učitavanje vrećica...
                                </h3>

                            </div>

                        ) : vrecice.length === 0 ? (

                            <div className="restaurant-empty">

                                <div className="restaurant-empty-icon">
                                    🎁
                                </div>

                                <h3>
                                    Nemate objavljenih vrećica
                                </h3>

                                <p>
                                    Kreirajte prvu vrećicu
                                    koristeći formu iznad.
                                </p>

                            </div>

                        ) : (

                            <div className="bag-list">

                                {vrecice.map(v => (

                                    <article
                                        className={
                                            v.aktivna
                                                ? "bag-card"
                                                : "bag-card inactive"
                                        }
                                        key={v.id}
                                    >

                                        <div className="bag-card-icon">
                                            🎁
                                        </div>


                                        <div className="bag-card-info">

                                            <div className="bag-card-title">

                                                <h4>
                                                    {v.naziv}
                                                </h4>

                                                <span
                                                    className={
                                                        v.aktivna
                                                            ? "bag-status active"
                                                            : "bag-status"
                                                    }
                                                >

                                                    <span />

                                                    {v.aktivna
                                                        ? "Aktivna"
                                                        : "Neaktivna"}

                                                </span>

                                            </div>


                                            <p>
                                                {v.opis ||
                                                    "Vrećica iznenađenja"}
                                            </p>


                                            <div className="bag-price">

                                                <span className="old-price">
                                                    {Number(
                                                        v.originalnaCijena ||
                                                            0
                                                    ).toFixed(2)}
                                                    {" "}
                                                    KM
                                                </span>

                                                <strong>
                                                    {Number(
                                                        v.akcijskaCijena ||
                                                            0
                                                    ).toFixed(2)}
                                                    {" "}
                                                    KM
                                                </strong>

                                            </div>

                                        </div>


                                        <div className="bag-card-controls">

                                            <span className="control-label">
                                                Količina
                                            </span>


                                            <div className="quantity-control">

                                                <button
                                                    onClick={() =>
                                                        azurirajKolicinu(
                                                            v.id,
                                                            v.kolicina - 1
                                                        )
                                                    }
                                                >
                                                    −
                                                </button>

                                                <strong>
                                                    {v.kolicina}
                                                </strong>

                                                <button
                                                    onClick={() =>
                                                        azurirajKolicinu(
                                                            v.id,
                                                            v.kolicina + 1
                                                        )
                                                    }
                                                >
                                                    +
                                                </button>

                                            </div>


                                            <button
                                                className={
                                                    v.aktivna
                                                        ? "bag-toggle-button deactivate"
                                                        : "bag-toggle-button activate"
                                                }
                                                onClick={() =>
                                                    PromijeniStatus(
                                                        v.id,
                                                        v.aktivna
                                                    )
                                                }
                                            >
                                                {v.aktivna
                                                    ? "Deaktiviraj"
                                                    : "Aktiviraj"}
                                            </button>

                                        </div>

                                    </article>

                                ))}

                            </div>

                        )}

                    </div>

                </section>

            </main>


            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="restoran-footer">

                <div>

                    <strong>
                        Eatery
                    </strong>

                    <span>
                        © 2026 — Vaš restoran, dio bolje priče.
                    </span>

                </div>

                <span>
                    Manje otpada. Više hrane. 🍽️
                </span>

            </footer>

        </div>
    );
};

export default RestoranPanel;
