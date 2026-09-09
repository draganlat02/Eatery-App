import React, { useState, useEffect } from 'react';
import API from '../api';

function HeroVrecice({ onDodajUVrecicu }) {
    const [vrecice, setVrecice] = useState([]);

    // Učitavanje aktivnih vrećica sa backenda
    useEffect(() => {
        API.get('/vrecice/aktivne') // Prilagodi tvojoj backend ruti (npr. /vrecice ili /vrecice/aktivne)
            .then(res => setVrecice(res.data))
            .catch(err => console.error("Greška pri učitavanju vrećica:", err));
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#fff3cd', borderRadius: '10px', marginBottom: '30px' }}>
            <h2 style={{ color: '#856404' }}>🎁 Vrećice Iznenađenja sa Popustom!</h2>
            <p>Spasite hranu i kupite obrok po znatno nižoj cijeni.</p>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '15px' }}>
                {vrecice.length === 0 ? (
                    <p>Trenutno nema dostupnih vrećica iznenađenja.</p>
                ) : (
                    vrecice.map(v => (
                        <div key={v.id} style={{ border: '1px solid #ffebaba', padding: '15px', borderRadius: '8px', backgroundColor: '#fff', width: '250px' }}>
                            <h4>{v.naziv}</h4>
                            <p style={{ fontSize: '14px', color: '#666' }}>{v.opis}</p>
                            <p style={{ margin: '5px 0' }}>
                                <span style={{ textDecoration: 'line-through', color: '#888', marginRight: '8px' }}>{v.staraCijena} KM</span>
                                <strong style={{ color: '#d9534f', fontSize: '18px' }}>{v.akcijskaCijena} KM</strong>
                            </p>
                            <button 
                                onClick={() => onDodajUVrecicu(v)}
                                style={{ width: '100%', padding: '8px', backgroundColor: '#ff9800', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                🛒 Dodaj u Korpu
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default HeroVrecice;