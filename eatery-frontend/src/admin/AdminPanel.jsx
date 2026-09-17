import React, { useEffect, useState } from 'react';
import API from '../api';
import './AdminPanel.css';

function AdminPanel({ user, onLogout }) {
    const [zahtjevi, setZahtjevi] = useState([]);
    const [poruka, setPoruka] = useState('');
    const [loading, setLoading] = useState(true);

    const ucitajZahtjeve = async () => {
        try {
            setLoading(true);
            const res = await API.get('/admin/zahtjevi');
            setZahtjevi(res.data);
        } catch (err) {
            console.error('Greška pri učitavanju zahtjeva:', err);
            const porukaGreske = err.response?.data?.message || err.message || 'Nepoznata greška';
            setPoruka(`Greška: ${porukaGreske}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        ucitajZahtjeve();
    }, []);

    const obradiZahtjev = async (id, odobreno) => {
        try {
            const res = await API.post(`/admin/zahtjevi/${id}/obradi?odobreno=${odobreno}`);
            setPoruka(typeof res.data === 'string' ? res.data : 'Zahtjev je obrađen.');
            ucitajZahtjeve();
        } catch (err) {
            console.error('Greška pri obradi zahtjeva:', err);
            setPoruka('Došlo je do greške prilikom obrade zahtjeva.');
        }
    };

    if (loading) {
        return (
            <div className="admin-loading">
                Učitavanje zahtjeva za aktivaciju...
            </div>
        );
    }

    return (
        <div className="admin-page">
            <header className="admin-navbar">
                <div className="admin-navbar-inner">
                    <div className="admin-brand">
                        <div className="admin-logo" aria-hidden="true">E</div>
                        <div>
                            <div className="admin-brand-name">Eatery</div>
                            <div className="admin-brand-subtitle">Administracija</div>
                        </div>
                    </div>
                    <div className="admin-user">
                        <span>{user?.korisnickoIme || 'Administrator'}</span>
                        {onLogout && (
                            <button className="admin-logout" type="button" onClick={onLogout}>
                                Odjava
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="admin-content">
                <div className="admin-heading">
                    <span>ADMIN PANEL</span>
                    <h1>Zahtjevi za aktivaciju</h1>
                    <p>Pregledajte i odobrite restorane koji čekaju da se pojave na platformi.</p>
                </div>

                {poruka && <div className="admin-alert">{poruka}</div>}

                <div className="admin-card">
                    {zahtjevi.length === 0 ? (
                        <div className="admin-empty">
                            <h3>Nema novih zahtjeva</h3>
                            <p>Trenutno nema restorana koji čekaju aktivaciju.</p>
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Korisničko ime</th>
                                    <th>Email</th>
                                    <th>Datum</th>
                                    <th>Akcije</th>
                                </tr>
                            </thead>
                            <tbody>
                                {zahtjevi.map((z) => (
                                    <tr key={z.id}>
                                        <td>{z.id}</td>
                                        <td>{z.korisnik?.korisnickoIme || 'N/A'}</td>
                                        <td>{z.korisnik?.email || 'N/A'}</td>
                                        <td>
                                            {z.datumPodnosenja
                                                ? new Date(z.datumPodnosenja).toLocaleString()
                                                : 'N/A'}
                                        </td>
                                        <td>
                                            <div className="admin-actions">
                                                <button
                                                    className="admin-approve"
                                                    type="button"
                                                    onClick={() => obradiZahtjev(z.id, true)}
                                                >
                                                    Odobri
                                                </button>
                                                <button
                                                    className="admin-reject"
                                                    type="button"
                                                    onClick={() => obradiZahtjev(z.id, false)}
                                                >
                                                    Odbij
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AdminPanel;
