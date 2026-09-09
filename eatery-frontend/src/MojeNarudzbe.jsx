import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MojeNarudzbe = ({ kupacId }) => {
    const [narudzbe, setNarudzbe] = useState([]);
    const [ucitavanje, setUcitavanje] = useState(true);
    const [greska, setGreska] = useState('');

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

    const getStatusStyle = (status) => {
        switch (status) {
            case 'KREIRANA': return { color: '#d97706', label: '⏳ Na čekanju' };
            case 'PRIHVAĆENA': return { color: '#2563eb', label: '👨‍🍳 U pripremi' };
            case 'DOSTAVLJENO': return { color: '#16a34a', label: '✅ Dostavljeno' };
            case 'ODBIJENA': return { color: '#dc2626', label: '❌ Odbijeno' };
            default: return { color: '#4b5563', label: status };
        }
    };

    if (ucitavanje) return <div>Učitavanje istorije narudžbi...</div>;
    if (greska) return <div style={{ color: 'red' }}>{greska}</div>;

    return (
        <div style={{ marginTop: '20px' }}>
            <h2>Moje Narudžbe</h2>
            {narudzbe.length === 0 ? (
                <p>Nemate napravljenih narudžbi.</p>
            ) : (
                narudzbe.map((n) => {
                    const statusInfo = getStatusStyle(n.status);
                    return (
                        <div 
                            key={n.id} 
                            style={{ 
                                border: '1px solid #e5e7eb', 
                                borderRadius: '8px', 
                                padding: '16px', 
                                marginBottom: '16px', 
                                backgroundColor: '#fff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                                <div>
                                    <strong>Šifra:</strong> {n.sifra || `#${n.id}`} <br />
                                    <strong>Restoran:</strong> {n.restoranNaziv || 'N/A'}
                                </div>
                                <div>
                                    <span style={{ fontWeight: 'bold', color: statusInfo.color }}>
                                        {statusInfo.label}
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginTop: '12px' }}>
                                <strong>Naručena jela:</strong>
                                <ul style={{ marginTop: '6px', paddingLeft: '20px' }}>
                                    {n.stavke && n.stavke.map((s, idx) => (
                                        <li key={idx}>
                                            {s.nazivJela || 'Jelo'} x {s.kolicina} — <strong>{s.cijena} KM</strong>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
                                <span><strong>Adresa dostave:</strong> {n.adresaDostave}</span>
                                <span><strong>Ukupno:</strong> {n.ukupnaCijena} KM</span>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default MojeNarudzbe;