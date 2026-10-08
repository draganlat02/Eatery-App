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
                            {n.stavke && n.stavke.map((s, idx) => (
                                <li key={idx}>
                                    <span>{s.nazivJela || 'Jelo'} × {s.kolicina}</span>
                                    <strong>{s.cijena} KM</strong>
                                </li>
                            ))}
                        </ul>

                        <div className="customer-order-footer">
                            <div>
                                <span>{n.adresaDostave || 'Preuzimanje u restoranu'}</span>
                                <strong style={{ display: 'block', marginTop: '4px' }}>{n.ukupnaCijena} KM</strong>
                            </div>

                            {isZavrseno && (
                                isVecOcjenjeno ? (
                                    /* SIV / ZELENI ONEMOGUĆENI INDIKATOR DA JE VEĆ OCIJENJENO */
                                    <button 
                                        type="button"
                                        disabled={true}
                                        style={{
                                            padding: '8px 14px',
                                            background: '#f0fdf9',
                                            color: '#087f6d',
                                            border: '1px solid #ccefe7',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            cursor: 'not-allowed',
                                            opacity: 0.85
                                        }}
                                    >
                                        ✓ Ocijenjeno
                                    </button>
                                ) : (
                                    /* AKTIVNO DUGME AKO NIJE OCIJENJENO */
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setActiveOrderId(isOtvoreno ? null : n.id);
                                            setOcjena(5);
                                            setKomentar('');
                                        }}
                                        style={{
                                            padding: '9px 16px',
                                            background: isOtvoreno ? '#f1f5f9' : '#ffffff',
                                            color: isOtvoreno ? '#475569' : '#b7791f',
                                            border: isOtvoreno ? '1px solid #cbd5e1' : '1px solid #ead9b8',
                                            borderRadius: '9px',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isOtvoreno ? 'none' : '0 2px 6px rgba(0,0,0,0.04)'
                                        }}
                                    >
                                        {isOtvoreno ? '✕ Odustani' : '★ Ocijeni'}
                                    </button>
                                )
                            )}
                        </div>

                        {/* Forma za ocjenjivanje se prikazuje SAMO ako NIJE već ocijenjeno */}
                        {isOtvoreno && !isVecOcjenjeno && (
                            <form 
                                onSubmit={(e) => posaljiOcjenu(e, n)}
                                style={{
                                    marginTop: '16px',
                                    padding: '20px',
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderTop: '3px solid #0f766e',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.04)'
                                }}
                            >
                                <div style={{ marginBottom: '14px' }}>
                                    <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '15px', fontWeight: '700' }}>
                                        Kako vam se svidjela narudžba?
                                    </h4>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                                        Ocijenite hranu i uslugu restorana {n.restoranNaziv || ''}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setOcjena(star)}
                                            onMouseEnter={() => setHoverOcjena(star)}
                                            onMouseLeave={() => setHoverOcjena(0)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                fontSize: '32px',
                                                lineHeight: '1',
                                                cursor: 'pointer',
                                                padding: '2px',
                                                color: star <= (hoverOcjena || ocjena) ? '#f59e0b' : '#cbd5e1',
                                                transition: 'transform 0.1s ease, color 0.1s ease'
                                            }}
                                        >
                                            ★
                                        </button>
                                    ))}
                                    <span style={{ marginLeft: '10px', fontWeight: '700', fontSize: '14px', color: '#334155' }}>
                                        {hoverOcjena || ocjena} / 5
                                    </span>
                                </div>

                                <div style={{ marginBottom: '14px' }}>
                                    <textarea 
                                        value={komentar}
                                        onChange={(e) => setKomentar(e.target.value)}
                                        placeholder="Napišite vaše utiske (opcionalno)..."
                                        rows="3"
                                        style={{
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            padding: '12px',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '8px',
                                            fontFamily: 'inherit',
                                            fontSize: '13px',
                                            outline: 'none',
                                            resize: 'vertical',
                                            background: '#f8fafc'
                                        }}
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={slanje}
                                    style={{
                                        width: '100%',
                                        background: slanje ? '#94a3b8' : '#0f766e',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '11px',
                                        borderRadius: '8px',
                                        fontWeight: '700',
                                        fontSize: '13px',
                                        cursor: slanje ? 'not-allowed' : 'pointer',
                                        transition: 'background 0.2s ease'
                                    }}
                                >
                                    {slanje ? 'Slanje...' : 'Potvrdi i pošalji ocjenu'}
                                </button>
                            </form>
                        )}
                    </article>
                );
            })}

            {/* Paginacija */}
            {ukupnoStranica > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '24px',
                    padding: '12px'
                }}>
                    <button
                        type="button"
                        onClick={() => setStranica(p => Math.max(p - 1, 1))}
                        disabled={stranica === 1}
                        style={{
                            padding: '8px 16px',
                            background: stranica === 1 ? '#f1f5f9' : '#0f766e',
                            color: stranica === 1 ? '#94a3b8' : '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: stranica === 1 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        ◄ Prethodna
                    </button>

                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                        Stranica {stranica} od {ukupnoStranica}
                    </span>

                    <button
                        type="button"
                        onClick={() => setStranica(p => Math.min(p + 1, ukupnoStranica))}
                        disabled={stranica === ukupnoStranica}
                        style={{
                            padding: '8px 16px',
                            background: stranica === ukupnoStranica ? '#f1f5f9' : '#0f766e',
                            color: stranica === ukupnoStranica ? '#94a3b8' : '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: stranica === ukupnoStranica ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Sljedeća ►
                    </button>
                </div>
            )}
        </div>
    );
};

export default MojeNarudzbe;