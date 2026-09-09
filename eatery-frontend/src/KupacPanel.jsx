import React, { useState, useEffect } from 'react';
import API from './api';
import MojeNarudzbe from './MojeNarudzbe';
import HeroVrecice from "./components/HeroVrecice";

function KupacPanel({ user }) {
    const [restorani, setRestorani] = useState([]);
    const [izabraniRestoran, setIzabraniRestoran] = useState(null);
    const [jela, setJela] = useState([]);
    const [korpa, setKorpa] = useState([]);
    const [adresa, setAdresa] = useState('');
    const [poruka, setPoruka] = useState('');
    const [osveziNarudzbe, setOsveziNarudzbe] = useState(0);

    useEffect(() => {
        API.get('/kupac/restorani')
            .then(res => setRestorani(res.data))
            .catch(err => console.error(err));
    }, []);

    const izaberiRestoran = async (restoran) => {
        setIzabraniRestoran(restoran);
        setKorpa([]);
        try {
            const res = await API.get(`/restoran/${restoran.id}/jela`);
            setJela(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const dodajUKorpu = (jelo) => {
        const postojeca = korpa.find(item => item.jelo.id === jelo.id);
        if (postojeca) {
            setKorpa(korpa.map(item => item.jelo.id === jelo.id ? { ...item, kolicina: item.kolicina + 1 } : item));
        } else {
            setKorpa([...korpa, { jelo, kolicina: 1 }]);
        }
    };

    // Funkcija za dodavanje Vrećice Iznenađenja direktno sa Hero sekcije
    const rukujDodavanjemVrecice = (vrecica) => {
        console.log("Dodata vrećica u korpu:", vrecica);
        // Automatski selektujemo restoran koji nudi vrećicu ako već nije selektovan
        if (!izabraniRestoran || (izabraniRestoran.id !== vrecica.restoran?.id && izabraniRestoran.idKorisnika !== vrecica.restoran?.idKorisnika)) {
            setIzabraniRestoran(vrecica.restoran);
        }

        // Dodajemo vrećicu u korpu kao specijalnu stavku
        const vrecicaJelo = {
            id: `vrecica_${vrecica.id}`,
            naziv: `🎁 ${vrecica.naziv}`,
            cijena: vrecica.akcijskaCijena,
            opis: vrecica.opis
        };

        dodajUKorpu(vrecicaJelo);
        setPoruka(`Dodato u korpu: ${vrecica.naziv}`);
    };

    const ukupnaCijenaKorpe = korpa.reduce((sum, item) => sum + item.jelo.cijena * item.kolicina, 0);

const posaljiNarudzbu = async (e) => {
    if (e) e.preventDefault();
    if (korpa.length === 0) return alert('Vaša korpa je prazna!');

    const kId = user?.id || user?.idKorisnika;
    const rId = izabraniRestoran?.id || izabraniRestoran?.idKorisnika;

    if (!kId || !rId) {
        alert("Nedostaje ID kupca ili restorana!");
        return;
    }

    const stavkeDTO = korpa.map(item => {
        const artikal = item.jelo || item.vrecica || item;
        let siroviId = artikal.id || artikal.idJela || artikal.vrecicaId;
        
        // Određujemo da li je vrećica ili jelo
        const jeVrecica = 
            (typeof siroviId === 'string' && siroviId.includes('vrecica')) || 
            artikal.akcijskaCijena !== undefined;

        // Ako je ID oblika 'vrecica_1', izvuci čist broj 1
        if (typeof siroviId === 'string' && siroviId.includes('_')) {
            siroviId = siroviId.split('_')[1];
        }

        const konvertovanId = Number(siroviId);
        const cijena = artikal.cijena || artikal.akcijskaCijena || 0;

        return {
            jeloId: !isNaN(konvertovanId) ? konvertovanId : null,
            tipStavke: jeVrecica ? "VRECICA" : "JELO", // <-- Šaljemo podatak o tipu
            kolicina: Number(item.kolicina || 1),
            cijena: Number(cijena)
        };
    });

    console.log("Stavke sa tipom spremljene za backend:", stavkeDTO);

    const imaNevalidnih = stavkeDTO.some(s => s.jeloId === null);
    if (imaNevalidnih) {
        alert("Greška: Jedan od artikala nema ispravan ID!");
        return;
    }

    const dto = {
        kupacId: Number(kId),
        restoranId: Number(rId),
        adresaDostave: adresa || "Preuzimanje u restoranu",
        ukupnaCijena: Number(ukupnaCijenaKorpe),
        stavke: stavkeDTO
    };

    try {
        await API.post('/narudzbe', dto);
        alert('🎉 Narudžba je uspešno poslata!');
        setKorpa([]);
        setAdresa('');
        if (typeof setOsveziNarudzbe === 'function') {
            setOsveziNarudzbe(prev => prev + 1);
        }
    } catch (err) {
        console.error("Greška sa backenda:", err.response?.data || err.message);
        alert(`Greška prilikom slanja: ${err.response?.data?.message || err.response?.data || err.message}`);
    }
};

    return (
        <div style={{ marginTop: '20px', padding: '0 20px' }}>
            {/* HERO SEKCIJA SA VREĆICAMA IZNENAĐENJA NA SAMOM VRHU */}
            <HeroVrecice onDodajUVrecicu={rukujDodavanjemVrecice} />

            <h2>Dobrodošli, {user?.ime || user?.korisnickoIme}!</h2>
            {poruka && <p style={{ color: 'green', fontWeight: 'bold' }}>{poruka}</p>}

            {!izabraniRestoran ? (
                <div>
                    <h3>Izaberite Restoran:</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        {restorani.map(r => (
                            <div key={r.id || r.idKorisnika} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => izaberiRestoran(r)}>
                                <h4>{r.nazivObjekta || r.korisnickoIme}</h4>
                                <p>{r.opis || 'Nema opisa'}</p>
                                <button style={{ padding: '6px 12px' }}>Pogledaj Meni</button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div>
                    <button onClick={() => setIzabraniRestoran(null)} style={{ marginBottom: '15px' }}>← Nazad na restorane</button>
                    <h3>Meni restorana: {izabraniRestoran.nazivObjekta || izabraniRestoran.korisnickoIme}</h3>

                    <div style={{ display: 'flex', gap: '30px' }}>
                        {/* Lista jela */}
                        <div style={{ flex: 2 }}>
                            <h4>Ponuda jela</h4>
                            {jela.map(j => (
                                <div key={j.id || j.idJela} style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong>{j.naziv}</strong> - {j.cijena} KM
                                        <br /><small>{j.opis}</small>
                                    </div>
                                    <button onClick={() => dodajUKorpu(j)} style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Dodaj u korpu</button>
                                </div>
                            ))}
                        </div>

                        {/* Korpa */}
                        <div style={{ flex: 1, border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
                            <h4>Vaša Korpa</h4>
                            {korpa.length === 0 ? <p>Korpa je prazna.</p> : (
                                <div>
                                    {korpa.map(item => (
                                        <div key={item.jelo.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span>{item.jelo.naziv} x{item.kolicina}</span>
                                            <span>{(item.jelo.cijena * item.kolicina).toFixed(2)} KM</span>
                                        </div>
                                    ))}
                                    <hr />
                                    <p><strong>Ukupno: {ukupnaCijenaKorpe.toFixed(2)} KM</strong></p>
                                    
                                    <form onSubmit={posaljiNarudzbu}>
                                        <input 
                                            type="text" 
                                            placeholder="Adresa dostave" 
                                            value={adresa} 
                                            onChange={e => setAdresa(e.target.value)} 
                                            required 
                                            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                                        />
                                        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Potvrdi i Naruči</button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Prikaz istorije narudžbi na dnu panela */}
            <hr style={{ margin: '40px 0 20px 0' }} />
            <MojeNarudzbe 
                kupacId={user?.id || user?.idKorisnika} 
                key={osveziNarudzbe} 
            />
        </div>
    );
}

export default KupacPanel;