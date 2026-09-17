import React, { useState } from 'react';
import API from '../api';
import './Login.css';

function Login({ onLoginSuccess, onSwitchToRegister }) {
    const [korisnickoIme, setKorisnickoIme] = useState('');
    const [sifra, setSifra] = useState('');
    const [poruka, setPoruka] = useState('');
    const [greska, setGreska] = useState(false);
    const [ucitavanje, setUcitavanje] = useState(false);
    const [prikaziLozinku, setPrikaziLozinku] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setGreska(false);
        setPoruka('Prijava u toku...');
        setUcitavanje(true);
        try {
            const res = await API.post('/auth/login', { korisnickoIme, sifra });
            localStorage.setItem('user', JSON.stringify(res.data));
            if (onLoginSuccess) {
                onLoginSuccess(res.data);
            }
        } catch (err) {
            setGreska(true);
            if (err.response) {
                setPoruka(err.response.data?.message || `Greška na serveru: Status ${err.response.status}`);
            } else if (err.request) {
                setPoruka('Backend server nije dostupan.');
            } else {
                setPoruka('Došlo je do greške: ' + err.message);
            }
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

                <h2 className="login-title">Prijava</h2>
                <p className="login-subtitle">Unesite podatke da nastavite u aplikaciju.</p>

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="login-field">
                        <label htmlFor="login-username">Korisničko ime</label>
                        <input
                            id="login-username"
                            type="text"
                            autoComplete="username"
                            value={korisnickoIme}
                            onChange={(e) => setKorisnickoIme(e.target.value)}
                            required
                        />
                    </div>
                    <div className="login-field">
                        <label htmlFor="login-password">Lozinka</label>
                        <div className="login-password-wrap">
                            <input
                                id="login-password"
                                type={prikaziLozinku ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={sifra}
                                onChange={(e) => setSifra(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="login-toggle-password"
                                onClick={() => setPrikaziLozinku((v) => !v)}
                            >
                                {prikaziLozinku ? 'Sakrij' : 'Prikaži'}
                            </button>
                        </div>
                    </div>
                    <button className="login-submit" type="submit" disabled={ucitavanje}>
                        {ucitavanje ? 'Prijava...' : 'Prijavi se'}
                    </button>
                    {poruka && (
                        <p className={`login-message ${greska ? 'error' : 'pending'}`}>
                            {poruka}
                        </p>
                    )}
                </form>

                {onSwitchToRegister && (
                    <div className="login-register">
                        <p>Nemate nalog?</p>
                        <button type="button" onClick={onSwitchToRegister}>
                            Registrujte se kao kupac
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Login;
