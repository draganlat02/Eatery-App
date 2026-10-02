import React, { useState } from 'react';
import API from '../api';
import './Login.css';

function RegisterKlijent({ onSwitchToLogin }) {
    
    const [formData, setFormData] = useState({
        korisnickoIme: '',
        sifra: '',
        email: '',
        nazivObjekta: '',
        opis: ''
    });

    const [poruka, setPoruka] = useState('');
    const [greska, setGreska] = useState(false);
    const [ucitavanje, setUcitavanje] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();
        setPoruka('');
        setGreska(false);
        setUcitavanje(true);

        try {

            const res = await API.post('/auth/registracija/klijent', formData);

            setPoruka(
                res.data?.message ||
                'Zahtjev je uspješno poslat! Administrator će pregledati vaš zahtjev i aktivirati nalog.'
            );
        } catch (err) {

            setGreska(true);
            setPoruka(err.response?.data?.message || 'Greška pri slanju zahtjeva.');
        } finally {

            setUcitavanje(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-brand">
                    <div className="login-logo" aria-hidden="true">E</div>
                    <div>
                        <div className="login-brand-name">Eatery</div>
                        <div className="login-brand-subtitle">Postanite naš partner</div>
                    </div>
                </div>

                <h2 className="login-title">Zahtjev da postanete klijent</h2>
                <p className="login-subtitle">
                    Popunite podatke o vašem restoranu. Nalog se aktivira nakon što ga
                    administrator odobri.
                </p>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label htmlFor="reg-k-naziv">Naziv objekta</label>
                        <input
                            id="reg-k-naziv"
                            name="nazivObjekta"
                            placeholder="npr. Restoran Kod Marka"
                            value={formData.nazivObjekta}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="login-field">
                        <label htmlFor="reg-k-username">Korisničko ime</label>
                        <input
                            id="reg-k-username"
                            name="korisnickoIme"
                            autoComplete="username"
                            value={formData.korisnickoIme}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="login-field">
                        <label htmlFor="reg-k-email">Email</label>
                        <input
                            id="reg-k-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="login-field">
                        <label htmlFor="reg-k-password">Lozinka</label>
                        <input
                            id="reg-k-password"
                            name="sifra"
                            type="password"
                            autoComplete="new-password"
                            value={formData.sifra}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="login-field">
                        <label htmlFor="reg-k-opis">Kratak opis restorana (opciono)</label>
                        <textarea
                            id="reg-k-opis"
                            name="opis"
                            rows="3"
                            placeholder="Vrsta kuhinje, atmosfera, poseban akcenat..."
                            value={formData.opis}
                            onChange={handleChange}
                        />
                    </div>
                    <button className="login-submit" type="submit" disabled={ucitavanje}>
                        {ucitavanje ? 'Slanje zahtjeva...' : 'Pošalji zahtjev'}
                    </button>
                    {poruka && (
                        <p className={`login-message ${greska ? 'error' : 'success'}`}>
                            {poruka}
                        </p>
                    )}
                </form>

                <div className="login-register">
                    <p>Već imate nalog?</p>
                    <button type="button" onClick={onSwitchToLogin}>
                        Prijavite se
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RegisterKlijent;
