import React, { useState } from 'react';
import API from '../api';
import './Login.css';

function RegisterKupac({ onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        korisnickoIme: '',
        sifra: '',
        email: '',
        ime: ''
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
            await API.post('/auth/registracija/kupac', formData);
            setPoruka('Uspješna registracija! Sada se možete prijaviti.');
        } catch (err) {
            setGreska(true);
            setPoruka(err.response?.data?.message || 'Greška pri registraciji.');
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
                        <div className="login-brand-subtitle">Spasena hrana u blizini</div>
                    </div>
                </div>

                <h2 className="login-title">Registracija</h2>
                <p className="login-subtitle">Otvorite nalog i naručujte vrećice iznenađenja.</p>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label htmlFor="reg-ime">Ime i prezime</label>
                        <input
                            id="reg-ime"
                            name="ime"
                            value={formData.ime}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="login-field">
                        <label htmlFor="reg-username">Korisničko ime</label>
                        <input
                            id="reg-username"
                            name="korisnickoIme"
                            autoComplete="username"
                            value={formData.korisnickoIme}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="login-field">
                        <label htmlFor="reg-email">Email</label>
                        <input
                            id="reg-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="login-field">
                        <label htmlFor="reg-password">Lozinka</label>
                        <input
                            id="reg-password"
                            name="sifra"
                            type="password"
                            autoComplete="new-password"
                            value={formData.sifra}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button className="login-submit" type="submit" disabled={ucitavanje}>
                        {ucitavanje ? 'Registracija...' : 'Registruj se'}
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

export default RegisterKupac;
