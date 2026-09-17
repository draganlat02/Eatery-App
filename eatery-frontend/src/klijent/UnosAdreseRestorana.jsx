import React, { useEffect, useState } from 'react';
import API from '../api';

const UnosAdreseRestorana = ({ restoranId: propRestoranId }) => {
    const [adresa, setAdresa] = useState('');
    const [poruka, setPoruka] = useState('');
    const [tipPoruke, setTipPoruke] = useState('');
    const [loading, setLoading] = useState(false);

    // Sigurno uzimanje ID-ja bez rušenja stranice
    const [restoranId, setRestoranId] = useState(propRestoranId || null);

    useEffect(() => {
        // Ako ID nije proslijeđen kao prop, pokušaj ga bezbjedno pročitati iz localStorage
        if (!propRestoranId) {
            try {
                const sačuvaniKorisnik = localStorage.getItem('korisnik');
                if (sačuvaniKorisnik) {
                    const parsed = JSON.parse(sačuvaniKorisnik);
                    // Proveravamo polja: id, idKorisnika ili klijentId
                    const pronadjeniId = parsed.id || parsed.idKorisnika || parsed.klijentId;
                    if (pronadjeniId) {
                        setRestoranId(pronadjeniId);
                    }
                }
            } catch (e) {
                console.error("Greška pri čitanju korisnika iz localStorage-a:", e);
            }
        } else {
            setRestoranId(propRestoranId);
        }
    }, [propRestoranId]);

    // Učitavanje postojeće adrese kada je ID dostupan
    useEffect(() => {
        if (!restoranId) return;

        API.get(`/restorani/${restoranId}/lokacija`)
            .then(res => {
                if (res.data && res.data.adresa) {
                    setAdresa(res.data.adresa);
                }
            })
            .catch(err => {
                console.error('Greška pri učitavanju lokacije:', err);
            });
    }, [restoranId]);

    const sacuvajLokaciju = async (e) => {
        e.preventDefault();

        if (!restoranId) {
            setTipPoruke('error');
            setPoruka('Greška: Niste prijavljeni ili ID restorana nije pronađen.');
            return;
        }

        if (!adresa.trim()) {
            setTipPoruke('error');
            setPoruka('Unesite adresu restorana.');
            return;
        }

        setLoading(true);
        setPoruka('');

        try {
            const response = await API.put(`/restorani/${restoranId}/lokacija`, {
                adresa: adresa.trim()
            });

            setTipPoruke('success');
            setPoruka('Lokacija restorana je uspješno sačuvana.');

        } catch (err) {
            console.error('Greška pri čuvanju lokacije:', err);
            setTipPoruke('error');

            if (!err.response) {
                setPoruka('Nije moguće povezati se sa serverom na portu 8000.');
            } else {
                setPoruka(
                    err.response?.data?.message || 
                    (typeof err.response?.data === 'string' ? err.response.data : 'Došlo je do greške.')
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="restaurant-location-section">
            <div className="location-heading">
                <div>
                    <span className="section-label">LOKACIJA OBJEKTA</span>
                    <h2>Adresa restorana</h2>
                    <p>Unesite adresu svog objekta kako bi kupci kasnije mogli pronaći restoran na mapi.</p>
                </div>
            </div>

            <div className="location-card">
                <div className="location-card-icon">📍</div>

                <div className="location-card-content">
                    <h3>Lokacija restorana</h3>
                    <p>Unesite punu adresu objekta. Sistem će automatski pronaći njegove geografske koordinate.</p>

                    <form onSubmit={sacuvajLokaciju} className="location-form">
                        <div className="location-input-wrapper">
                            <label>Adresa</label>
                            <input
                                type="text"
                                value={adresa}
                                onChange={(e) => setAdresa(e.target.value)}
                                placeholder="Npr. Kralja Petra I 15, Banja Luka"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="primary-button location-button"
                            disabled={loading}
                        >
                            {loading ? 'Pronalaženje lokacije...' : 'Sačuvaj lokaciju'}
                        </button>
                    </form>

                    {poruka && (
                        <div className={`location-message ${tipPoruke}`}>
                            <span>{tipPoruke === 'success' ? '✓' : '!'}</span>
                            {poruka}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default UnosAdreseRestorana;