import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NARUDZBI_PO_STRANICI = 5;

const statusMap = {
    KREIRANA: { className: 'waiting', label: 'Na čekanju' },
    ZAPRIMLJENO: { className: 'waiting', label: 'Zaprimljeno' },
    PRIHVAĆENA: { className: 'preparing', label: 'U pripremi' },
    U_PRIPREMI: { className: 'preparing', label: 'U pripremi' },
    SPREMNO: { className: 'ready', label: 'Spremno' },
    DOSTAVLJENO: { className: 'delivered', label: 'Dostavljeno' },
    ODBIJENA: { className: 'rejected', label: 'Odbijeno' },
};

const MojeNarudzbe = ({ kupacId }) => {
    const [narudzbe, setNarudzbe] = useState([]);
    const [ucitavanje, setUcitavanje] = useState(true);
    const [greska, setGreska] = useState('');
    const [stranica, setStranica] = useState(1);

    useEffect(() => {
        if (kupacId) {
            ucitajNarudzbe();
        }
    }, [kupacId]);

    const ucitajNarudzbe = async () => {
        try {
            setUcitavanje(true);
            const res = await axios.get(`http://localhost:8000/api/kupac/narudzbe/${kupacId}`);
            setNarudzbe(res.data);
        } catch (err) {
            console.error("Greška pri preuzimanju narudžbi:", err);
            setGreska("Nije moguće učitati narudžbe.");
        } finally {
            setUcitavanje(false);
        }
    };

    const ukupnoStranica = Math.max(1, Math.ceil(narudzbe.length / NARUDZBI_PO_STRANICI));

    useEffect(() => {
        if (stranica > ukupnoStranica) {
            setStranica(ukupnoStranica);
        }
    }, [stranica, ukupnoStranica]);

    if (ucitavanje) {
        return <div className="customer-orders-state">Učitavanje istorije narudžbi...</div>;
    }

    if (greska) {
        return <div className="customer-orders-state error">{greska}</div>;
    }

    if (narudzbe.length === 0) {
        return (
            <div className="customer-orders-empty">
                <h3>Nemate napravljenih narudžbi</h3>
                <p>Kada naručite jelo ili vrećicu, ovdje će se pojaviti historija.</p>
            </div>
        );
    }

    const prikazaneNarudzbe = narudzbe.slice(
        (stranica - 1) * NARUDZBI_PO_STRANICI,
        stranica * NARUDZBI_PO_STRANICI
    );

    return (
        <>
            <div className="customer-orders-list">
                {prikazaneNarudzbe.map((n) => {
                    const statusInfo = statusMap[n.status] || { className: 'waiting', label: n.status };
                    return (
                        <article className="customer-order-card" key={n.id}>
                            <div className="customer-order-top">
                                <div>
                                    <span className="customer-order-label">Narudžba</span>
                                    <h3>{n.sifra || `#${n.id}`}</h3>
                                    <p>{n.restoranNaziv || 'Restoran'}</p>
                                </div>
                                <span className={`customer-order-status ${statusInfo.className}`}>
                                    {statusInfo.label}
                                </span>
                            </div>

                            <ul className="customer-order-items">
                                {n.stavke && n.stavke.map((s, idx) => (
                                    <li key={idx}>
                                        <span>{s.nazivJela || 'Jelo'} × {s.kolicina}</span>
                                        <strong>{s.cijena} KM</strong>
                                    </li>
                                ))}
                            </ul>

                            <div className="customer-order-footer">
                                <span>{n.adresaDostave || 'Preuzimanje u restoranu'}</span>
                                <strong>{n.ukupnaCijena} KM</strong>
                            </div>
                        </article>
                    );
                })}
            </div>

            {narudzbe.length > NARUDZBI_PO_STRANICI && (
                <div className="orders-pagination">
                    <button
                        type="button"
                        disabled={stranica === 1}
                        onClick={() => setStranica((s) => Math.max(1, s - 1))}
                    >
                        Prethodna
                    </button>
                    <span>
                        Stranica {stranica} od {ukupnoStranica}
                    </span>
                    <button
                        type="button"
                        disabled={stranica === ukupnoStranica}
                        onClick={() => setStranica((s) => Math.min(ukupnoStranica, s + 1))}
                    >
                        Sljedeća
                    </button>
                </div>
            )}
        </>
    );
};

export default MojeNarudzbe;
