import React, { useState } from 'react';
import API from './api';

function RegisterKupac({ onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        korisnickoIme: '',
        sifra: '',
        email: '',
        ime: ''
    });
    const [poruka, setPoruka] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/auth/registracija/kupac', formData);
            setPoruka('Uspješna registracija! Sada se možete prijaviti.');
        } catch (err) {
            setPoruka(err.response?.data?.message || 'Greška pri registraciji!');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
            <h2>Registracija Kupca</h2>
            <form onSubmit={handleSubmit}>
                <input name="korisnickoIme" placeholder="Korisničko ime" onChange={handleChange} required style={{ width: '100%', marginBottom: '10px' }} />
                <input name="sifra" type="password" placeholder="Lozinka" onChange={handleChange} required style={{ width: '100%', marginBottom: '10px' }} />
                <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={{ width: '100%', marginBottom: '10px' }} />
                <input name="ime" placeholder="Ime i prezime" onChange={handleChange} required style={{ width: '100%', marginBottom: '10px' }} />
                <button type="submit" style={{ width: '100%', padding: '10px' }}>Registruj se</button>
            </form>
            {poruka && <p style={{ marginTop: '15px', color: 'green' }}>{poruka}</p>}
            <button onClick={onSwitchToLogin} style={{ marginTop: '10px', background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}>
                Već imate nalog? Prijavite se
            </button>
        </div>
    );
}

export default RegisterKupac;