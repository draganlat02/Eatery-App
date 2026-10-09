import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MojeNarudzbe.css';

const NARUDZBI_PO_STRANICI = 5;

const statusMap = {
    KREIRANA: { className: 'waiting', label: 'Na čekanju' },
    ZAPRIMLJENO: { className: 'waiting', label: 'Zaprimljeno' },
    PRIHVAĆENA: { className: 'preparing', label: 'U pripremi' },
    U_PRIPREMI: { className: 'preparing', label: 'U pripremi' },
    SPREMNO: { className: 'ready', label: 'Spremno' },
    DOSTAVLJENO: { className: 'delivered', label: 'Dostavljeno' },
    PREUZETO: { className: 'delivered', label: 'Preuzeto' },
    ODBIJENA: { className: 'rejected', label: 'Odbijeno' },
    OTKAZANA: { className: 'rejected', label: 'Otkazano' },
    OTKAZANO: { className: 'rejected', label: 'Otkazano' },
};

const MojeNarudzbe = ({ kupacId }) => {
    const [narudzbe, setNarudzbe] = useState([]);
    const [ucitavanje, setUcitavanje] = useState(true);
    const [greska, setGreska] = useState('');
    const [stranica, setStranica] = useState(1);

    // Stanja za ocjenjivanje
    const [activeOrderId, setActiveOrderId] = useState(null);
    const [ocjena, setOcjena] = useState(5);
    const [hoverOcjena, setHoverOcjena] = useState(0);
    const [komentar, setKomentar] = useState('');
    const [slanje, setSlanje] = useState(false);
    const [ocjenjeneNarudzbe, setOcjenjeneNarudzbe] = useState([]);

    useEffect(() => {
        if (kupacId) {
            ucitajNarudzbe();
        }
    }, [kupacId]);

    const ucitajNarudzbe = async () => {
        try {
            setUcitavanje(true);
            setGreska('');
            const token = localStorage.getItem('jwtToken') || localStorage.getItem('token');

            if (!token) {
                setGreska("Niste prijavljeni. Molimo prijavite se ponovo.");
                setUcitavanje(false);
                return;
            }

            const res = await axios.get(`http://localhost:8000/api/narudzbe/kupac/${kupacId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const sortiraneNarudzbe = [...res.data].sort((a, b) => b.id - a.id);
            setNarudzbe(sortiraneNarudzbe);

            // 1. Proveravamo direktna boolean polja iz DTO-a (ako postoje)
            const vecOcjenjeneIzDto = sortiraneNarudzbe
                .filter(n => n.ocjenjeno || n.isOcjenjeno || n.ocjenjena || n.recenzijaId || n.ocjena || n.hasRecenzija)
                .map(n => n.id);

            setOcjenjeneNarudzbe(vecOcjenjeneIzDto);

            // 2. PROVJERAVAMO PREKO BACKEND ENDPOINTA /provjeri/{id} ZA SVE ZAVRŠENE NARUDŽBE
            // Ovo 100% garantuje da će ocijenjene narudžbe biti detektovane, bez obzira na Jackson/DTO nazive!
            const zavrsene = sortiraneNarudzbe.filter(n => n.status === 'PREUZETO' || n.status === 'DOSTAVLJENO');

            for (const n of zavrsene) {
                try {
                    const checkRes = await axios.get(`http://localhost:8000/api/recenzije/provjeri/${n.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (checkRes.data === true) {
                        setOcjenjeneNarudzbe(prev => Array.from(new Set([...prev, n.id])));
                    }
                } catch (cErr) {
                    // ignorisati greške pri provjeri
                }
            }

        } catch (err) {
            console.error("Greška pri preuzimanju narudžbi:", err);
            setGreska("Nije moguće učitati narudžbe.");
        } finally {
            setUcitavanje(false);
        }
    };

    const posaljiOcjenu = async (e, narudzba) => {
        e.preventDefault();
        const nId = narudzba.id || narudzba.narudzbaId;

        try {
            setSlanje(true);
            const token = localStorage.getItem('jwtToken') || localStorage.getItem('token');

            const payload = {
                idNarudzbe: Number(nId),
                ocjena: Number(ocjena),
                komentar: komentar || ""
            };

            await axios.post('http://localhost:8000/api/recenzije', payload, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Čim pošaljemo, označavamo narudžbu kao ocijenjenu
            setOcjenjeneNarudzbe(prev => Array.from(new Set([...prev, nId])));
            setActiveOrderId(null);
            setKomentar('');
            setOcjena(5);
            alert("Ocjena je uspješno poslata!");

        } catch (err) {
            console.error("Greška pri slanju ocjene:", err);

            const errData = err.response?.data;
            const errorMsg = typeof errData === 'string' ? errData : (errData?.message || JSON.stringify(errData || ''));

            // Ako backend javi da je već ocijenjena, ODMAH zaključaj dugme na frontu
            if (errorMsg.toLowerCase().includes('ocjenjen') || errorMsg.toLowerCase().includes('ocijenjen')) {
                setOcjenjeneNarudzbe(prev => Array.from(new Set([...prev, nId])));
                setActiveOrderId(null);
                alert("Ova narudžba je već ranije ocijenjena.");
            } else {
                alert(`Greška: ${errorMsg || "Došlo je do greške pri slanju ocjene."}`);
            }
        } finally {
            setSlanje(false);
        }
    };

    if (ucitavanje) return <div className="customer-orders-state">Učitavanje historije narudžbi...</div>;
    if (greska) return <div className="customer-orders-state error">{greska}</div>;
    if (narudzbe.length === 0) return <div className="customer-orders-empty">Nemate napravljenih narudžbi</div>;

    const ukupnoStranica = Math.ceil(narudzbe.length / NARUDZBI_PO_STRANICI);
    const prikazaneNarudzbe = narudzbe.slice(
        (stranica - 1) * NARUDZBI_PO_STRANICI,
        stranica * NARUDZBI_PO_STRANICI
    );

    return (
        <div className="customer-orders-list">
            {prikazaneNarudzbe.map((n) => {
                const statusInfo = statusMap[n.status] || { className: 'waiting', label: n.status };
                const isZavrseno = n.status === 'PREUZETO' || n.status === 'DOSTAVLJENO';
                const isVecOcjenjeno = ocjenjeneNarudzbe.includes(n.id);
                const isOtvoreno = activeOrderId === n.id;

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
                            {n.stavke && n.stavke.length > 0 ? n.stavke.map((s, idx) => (
                                <li key={idx}>
                                    <span>
                                        {s.nazivJela || s.naziv || (s.tipStavke === 'VRECICA' ? 'Vrećica iznenađenja' : 'Jelo')}
                                        {s.kolicina ? ` × ${s.kolicina}` : ''}
                                    </span>
                                    <strong>
                                        {s.cijena != null ? `${Number(s.cijena).toFixed(2)} KM` : ''}
                                    </strong>
                                </li>
                            )) : (
                                <li className="customer-order-items-empty">Nema stavki narudžbe</li>
                            )}
                        </ul>

                        <div className="customer-order-footer">
                            <div>
                                <span>{n.adresaDostave || 'Preuzimanje u restoranu'}</span>
                                <strong className="customer-order-total">{n.ukupnaCijena} KM</strong>
                            </div>

                            {isZavrseno && (
                                isVecOcjenjeno ? (
                                    <button type="button" className="badge-rated" disabled>
                                        ✓ Ocijenjeno
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className={isOtvoreno ? 'btn-rate-cancel' : 'btn-rate-open'}
                                        onClick={() => {
                                            setActiveOrderId(isOtvoreno ? null : n.id);
                                            setOcjena(5);
                                            setKomentar('');
                                        }}
                                    >
                                        {isOtvoreno ? '✕ Odustani' : '★ Ocijeni'}
                                    </button>
                                )
                            )}
                        </div>

                        {isOtvoreno && !isVecOcjenjeno && (
                            <form className="rating-inline-card" onSubmit={(e) => posaljiOcjenu(e, n)}>
                                <div className="rating-inline-header">
                                    <h4>Kako vam se svidjela narudžba?</h4>
                                    <p>Ocijenite hranu i uslugu restorana {n.restoranNaziv || ''}</p>
                                </div>

                                <div className="interactive-stars">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            className={`star-btn${star <= (hoverOcjena || ocjena) ? ' filled' : ''}`}
                                            onClick={() => setOcjena(star)}
                                            onMouseEnter={() => setHoverOcjena(star)}
                                            onMouseLeave={() => setHoverOcjena(0)}
                                        >
                                            ★
                                        </button>
                                    ))}
                                    <span className="star-rating-label">
                                        {hoverOcjena || ocjena} / 5
                                    </span>
                                </div>

                                <div className="rating-form-group">
                                    <textarea
                                        value={komentar}
                                        onChange={(e) => setKomentar(e.target.value)}
                                        placeholder="Napišite vaše utiske (opcionalno)..."
                                        rows="3"
                                    />
                                </div>

                                <button type="submit" className="btn-submit-rating" disabled={slanje}>
                                    {slanje ? 'Slanje...' : 'Potvrdi i pošalji ocjenu'}
                                </button>
                            </form>
                        )}
                    </article>
                );
            })}

            {ukupnoStranica > 1 && (
                <div className="orders-pagination">
                    <button
                        type="button"
                        onClick={() => setStranica(p => Math.max(p - 1, 1))}
                        disabled={stranica === 1}
                    >
                        ◄ Prethodna
                    </button>

                    <span>Stranica {stranica} od {ukupnoStranica}</span>

                    <button
                        type="button"
                        onClick={() => setStranica(p => Math.min(p + 1, ukupnoStranica))}
                        disabled={stranica === ukupnoStranica}
                    >
                        Sljedeća ►
                    </button>
                </div>
            )}
        </div>
    );
};

export default MojeNarudzbe;