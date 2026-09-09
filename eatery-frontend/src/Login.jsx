import React, { useState } from 'react';
import API from './api';

function Login({ onLoginSuccess }) {
    const [korisnickoIme, setKorisnickoIme] = useState('');
    const [sifra, setSifra] = useState('');
    const [poruka, setPoruka] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setPoruka('Slanje zahtjeva...');
        try {
            const res = await API.post('/auth/login', { korisnickoIme, sifra });
            localStorage.setItem('user', JSON.stringify(res.data));
            if (onLoginSuccess) {
                onLoginSuccess(res.data);
            }
        } catch (err) {
            if (err.response) {
                setPoruka(err.response.data?.message || `Greška na serveru: Status ${err.response.status}`);
            } else if (err.request) {
                setPoruka('Backend server nije dostupan!');
            } else {
                setPoruka('Došlo je do greške: ' + err.message);
            }
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
            <h2>Prijava na sistem</h2>
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Korisničko ime:</label>
                    <input 
                        type="text" 
                        value={korisnickoIme} 
                        onChange={(e) => setKorisnickoIme(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Lozinka:</label>
                    <input 
                        type="password" 
                        value={sifra} 
                        onChange={(e) => setSifra(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', cursor: 'pointer' }}>Prijavi se</button>
            </form>
            {poruka && <p style={{ marginTop: '15px', color: 'red', fontWeight: 'bold' }}>{poruka}</p>}
        </div>
    );
}

export default Login;