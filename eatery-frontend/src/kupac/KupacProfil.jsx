import React, { useEffect, useState } from 'react';
import API from '../api';
import './KupacPanel.css';

function KupacProfil({ kupacId, user, onUserUpdate }) {
    const [profil, setProfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [greska, setGreska] = useState('');
    const [uredi, setUredi] = useState(false);
    const [saving, setSaving] = useState(false);
    const [poruka, setPoruka] = useState('');
    const [forma, setForma] = useState({
        ime: '',
        email: '',
        korisnickoIme: ''
    });

    useEffect(() => {
        if (!kupacId) {
            setGreska('Nije pronađen ID kupca.');
            setLoading(false);
            return;
        }

        setLoading(true);
        API.get(`/kupac/profil/${kupacId}`)
            .then(res => {
                const data = res.data || {};
                setProfil(data);
                setForma({
                    ime: data.ime ?? '',
                    email: data.email ?? '',
                    korisnickoIme: data.korisnickoIme ?? ''
                });
                setGreska('');
            })
            .catch(err => {
                console.error('Greška pri učitavanju profila:', err);
                setGreska(
                    err.response?.data?.message ||
                    (typeof err.response?.data === 'string' ? err.response.data : null) ||
                    'Greška pri učitavanju profila.'
                );
            })
            .finally(() => {
                setLoading(false);
            });
    }, [kupacId]);

    const handleChange = (e) => {
        setForma({ ...forma, [e.target.name]: e.target.value });
    };

    const otkaziIzmjene = () => {
        setForma({
            ime: profil?.ime ?? '',
            email: profil?.email ?? '',
            korisnickoIme: profil?.korisnickoIme ?? ''
        });
        setPoruka('');
        setUredi(false);
    };

    const sacuvajProfil = async (e) => {
        e.preventDefault();
        setPoruka('');
        setSaving(true);

        try {
            const res = await API.put(`/kupac/profil/${kupacId}`, forma);
            const updatedData = res.data;
            
            setProfil(updatedData);
            setUredi(false);
            setPoruka('Profil je uspješno sačuvan.');

            const azuriraniUser = {
                ...(user || {}),
                korisnickoIme: updatedData.korisnickoIme,
                email: updatedData.email,
                ime: updatedData.ime
            };
            
            localStorage.setItem('user', JSON.stringify(azuriraniUser));
            if (onUserUpdate) {
                onUserUpdate(azuriraniUser);
            }
        } catch (err) {
            setPoruka(
                err.response?.data?.message ||
                (typeof err.response?.data === 'string' ? err.response.data : null) ||
                'Greška pri čuvanju profila.'
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <section className="profile-section" id="profil">
                <div className="profil-loading">
                    <div className="profil-loading-icon">◌</div>
                    <p>Učitavanje profila...</p>
                </div>
            </section>
        );
    }

    if (greska) {
        return (
            <section className="profile-section" id="profil">
                <div className="profil-error">
                    <div className="profil-error-icon">!</div>
                    <h3>Profil nije moguće učitati</h3>
                    <p>{String(greska)}</p>
                </div>
            </section>
        );
    }

    if (!profil) {
        return null;
    }

    const ime = profil.ime?.trim() || profil.korisnickoIme || 'Korisnik';
    const korisnickoIme = profil.korisnickoIme || 'korisnik';
    const email = profil.email || 'Email nije dostupan';
    const inicijal = ime.charAt(0).toUpperCase();
    const brojVrecica = Number(profil.ukupnoVrecica || 0);
    const ukupnaUsteda = Number(profil.ukupnaUstedaKM || 0);

    return (
        <section className="profile-section" id="profil">
            <div className="profile-heading">
                <span className="section-label">MOJ NALOG</span>
                <h2>Moj profil</h2>
                <p>Pregledajte statistiku i ažurirajte podatke svog Eatery naloga.</p>
            </div>

            <div className="profile-layout">
                <div className="profile-card profile-main-card">
                    <div className="profile-card-header">
                        <div className="profile-avatar">{inicijal}</div>
                        <div>
                            <span className="profile-label">Kupac</span>
                            <h3>{ime}</h3>
                            <p>@{korisnickoIme}</p>
                        </div>
                    </div>

                    <div className="profile-info-list">
                        <div className="profile-info-row">
                            <div className="profile-info-icon">👤</div>
                            <div>
                                <span className="profile-info-label">Ime i prezime</span>
                                <strong>{profil.ime || 'Nije uneseno'}</strong>
                            </div>
                        </div>
                        <div className="profile-info-row">
                            <div className="profile-info-icon">@</div>
                            <div>
                                <span className="profile-info-label">Korisničko ime</span>
                                <strong>{korisnickoIme}</strong>
                            </div>
                        </div>
                        <div className="profile-info-row">
                            <div className="profile-info-icon">✉</div>
                            <div>
                                <span className="profile-info-label">Email</span>
                                <strong>{email}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-card">
                    <div className="profile-card-title">
                        <div className="profile-card-icon">📊</div>
                        <div>
                            <h3>Eatery statistika</h3>
                            <p>Na osnovu završenih narudžbi</p>
                        </div>
                    </div>
                    <div className="profile-stats">
                        <div className="profile-stat">
                            <strong>{brojVrecica}</strong>
                            <span>Kupljenih vrećica</span>
                        </div>
                        <div className="profile-stat-divider" />
                        <div className="profile-stat">
                            <strong>{ukupnaUsteda.toFixed(2)} KM</strong>
                            <span>Ukupna ušteda</span>
                        </div>
                    </div>
                </div>

                <div className="profile-card profile-stats-card">
                    <div className="profile-card-title">
                        <div className="profile-card-icon">✎</div>
                        <div>
                            <h3>Podaci naloga</h3>
                            <p>Izmijenite ime, email ili korisničko ime</p>
                        </div>
                        {!uredi && (
                            <button
                                className="profile-edit-button"
                                type="button"
                                onClick={() => {
                                    setPoruka('');
                                    setUredi(true);
                                }}
                            >
                                Uredi
                            </button>
                        )}
                    </div>

                    {uredi ? (
                        <form className="profile-edit-form" onSubmit={sacuvajProfil}>
                            <div className="profile-edit-grid">
                                <label>
                                    Ime i prezime
                                    <input
                                        name="ime"
                                        value={forma.ime}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>
                                <label>
                                    Korisničko ime
                                    <input
                                        name="korisnickoIme"
                                        value={forma.korisnickoIme}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>
                                <label className="full">
                                    Email
                                    <input
                                        name="email"
                                        type="email"
                                        value={forma.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>
                            </div>
                            {poruka && <p className="profile-edit-message error">{poruka}</p>}
                            <div className="profile-edit-actions">
                                <button className="profile-save-button" type="submit" disabled={saving}>
                                    {saving ? 'Spremanje...' : 'Sačuvaj izmjene'}
                                </button>
                                <button
                                    className="profile-cancel-button"
                                    type="button"
                                    onClick={otkaziIzmjene}
                                    disabled={saving}
                                >
                                    Otkaži
                                </button>
                            </div>
                        </form>
                    ) : (
                        poruka && <p className="profile-edit-message success">{poruka}</p>
                    )}
                </div>
            </div>
        </section>
    );
}

export default KupacProfil;