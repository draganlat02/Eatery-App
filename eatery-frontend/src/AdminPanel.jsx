import React, { useEffect, useState } from 'react';
import API from './api';

function AdminPanel() {
    const [zahtjevi, setZahtjevi] = useState([]);
    const [poruka, setPoruka] = useState('');
    const [loading, setLoading] = useState(true);

    // Učitaj sve neobrađene zahteve sa backend-a
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

    // Funkcija za odobravanje ili odbijanje zahtjeva
    const obradiZahtjev = async (id, odobreno) => {
        try {
            const res = await API.post(`/admin/zahtjevi/${id}/obradi?odobreno=${odobreno}`);
            setPoruka(res.data);
            // Osveži listu zahtjeva nakon obrade
            ucitajZahtjeve();
        } catch (err) {
            console.error('Greška pri obradi zahtjeva:', err);
            setPoruka('Došlo je do greške prilikom obrade zahtjeva.');
        }
    };

    if (loading) {
        return <p>Učitavanje zahtjeva za aktivaciju...</p>;
    }

    return (
        <div style={{ marginTop: '20px' }}>
            <h3>Admin Panel - Zahtjevi za Aktivaciju Restorana</h3>

            {poruka && (
                <div style={{ padding: '10px', backgroundColor: '#e2e8f0', marginBottom: '15px', borderRadius: '4px' }}>
                    <strong>{poruka}</strong>
                </div>
            )}

            {zahtjevi.length === 0 ? (
                <p>Trenutno nema novih zahtjeva za aktivaciju.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }} border="1" cellPadding="10">
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
                            <th>ID Zahtjeva</th>
                            <th>Korisničko ime</th>
                            <th>Email</th>
                            <th>Datum zahtjeva</th>
                            <th>Akcije</th>
                        </tr>
                    </thead>
                    <tbody>
                        {zahtjevi.map((z) => (
                            <tr key={z.id}>
                                <td>{z.id}</td>
                                <td>{z.korisnik?.korisnickoIme || 'N/A'}</td>
                                <td>{z.korisnik?.email || 'N/A'}</td>
                                <td>{z.datumPodnosenja ? new Date(z.datumPodnosenja).toLocaleString() : 'N/A'}</td>
                                <td>
                                    <button 
                                        onClick={() => obradiZahtjev(z.id, true)} 
                                        style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '6px 12px', marginRight: '8px', cursor: 'pointer', borderRadius: '4px' }}
                                    >
                                        Odobri
                                    </button>
                                    <button 
                                        onClick={() => obradiZahtjev(z.id, false)} 
                                        style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px' }}
                                    >
                                        Odbij
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminPanel;