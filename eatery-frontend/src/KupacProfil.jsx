
import React, { useEffect, useState } from 'react';
import API from './api';

function KupacProfil({ kupacId }) {
    const [profil, setProfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [greska, setGreska] = useState('');

    useEffect(() => {
        if (!kupacId) {
            setGreska('Nije pronađen ID kupca.');
            setLoading(false);
            return;
        }

        API.get(`/kupac/profil/${kupacId}`)
            .then(res => {
                setProfil(res.data);
                setGreska('');
            })
            .catch(err => {
                console.error(
                    'Greška pri učitavanju profila:',
                    err
                );

                setGreska(
                    err.response?.data?.message ||
                    'Greška pri učitavanju profila.'
                );
            })
            .finally(() => {
                setLoading(false);
            });
    }, [kupacId]);

    if (loading) {
        return (
            <section className="profile-section">
                <div className="profile-loading">
                    <div className="profile-spinner" />
                    <span>Učitavanje profila...</span>
                </div>
            </section>
        );
    }

    if (greska) {
        return (
            <section className="profile-section">
                <div className="profile-error">
                    <div className="profile-error-icon">
                        !
                    </div>

                    <div>
                        <h3>
                            Profil nije moguće učitati
                        </h3>

                        <p>{greska}</p>
                    </div>
                </div>
            </section>
        );
    }

    if (!profil) {
        return null;
    }

    const ime =
        profil.ime?.trim() ||
        profil.korisnickoIme ||
        'Korisnik';

    const korisnickoIme =
        profil.korisnickoIme || 'korisnik';

    const email =
        profil.email || 'Email nije dostupan';

    const inicijal =
        ime.charAt(0).toUpperCase();

    const brojVrecica =
        Number(profil.ukupnoVrecica || 0);

    const ukupnaUsteda =
        Number(profil.ukupnaUstedaKM || 0);

    const cestiKupac =
        Boolean(profil.cestiKupac);

    return (
        <section
            className="profile-section"
            id="profil"
        >

            {/* =================================================
                NASLOV
            ================================================= */}

            <div className="profile-heading">

                <span className="section-label">
                    MOJ NALOG
                </span>

                <h2>
                    Moj profil
                </h2>

                <p>
                    Pregled vaših podataka i aktivnosti
                    na Eatery platformi.
                </p>

            </div>


            {/* =================================================
                GLAVNI PROFIL
            ================================================= */}

            <div className="profile-main">

                <div className="profile-user">

                    <div className="profile-avatar">
                        {inicijal}
                    </div>

                    <div className="profile-user-info">

                        <span className="profile-user-label">
                            KUPAC
                        </span>

                        <h3>
                            {ime}
                        </h3>

                        <div className="profile-username">
                            @{korisnickoIme}
                        </div>

                        <div className="profile-email">
                            {email}
                        </div>

                    </div>

                </div>


                <div
                    className={
                        cestiKupac
                            ? 'profile-customer-status frequent'
                            : 'profile-customer-status'
                    }
                >

                    <div className="status-dot" />

                    <div>
                        <span>
                            STATUS
                        </span>

                        <strong>
                            {cestiKupac
                                ? 'Česti kupac'
                                : 'Standardni kupac'}
                        </strong>
                    </div>

                </div>

            </div>


            {/* =================================================
                AKTIVNOST
            ================================================= */}

            <div className="profile-activity">

                <div className="profile-activity-header">

                    <div>
                        <span className="section-label">
                            MOJA AKTIVNOST
                        </span>

                        <h3>
                            Eatery statistika
                        </h3>
                    </div>

                    <span className="profile-activity-note">
                        Na osnovu završenih narudžbi
                    </span>

                </div>


                <div className="profile-statistics">

                    <div className="profile-stat">

                        <div className="profile-stat-symbol">
                            <span>✦</span>
                        </div>

                        <div className="profile-stat-content">

                            <strong>
                                {brojVrecica}
                            </strong>

                            <span>
                                Kupljenih vrećica
                            </span>

                        </div>

                    </div>


                    <div className="profile-stat-separator" />


                    <div className="profile-stat">

                        <div className="profile-stat-symbol">
                            <span>KM</span>
                        </div>

                        <div className="profile-stat-content">

                            <strong>
                                {ukupnaUsteda.toFixed(2)}
                            </strong>

                            <span>
                                Ukupna ušteda
                            </span>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                PODACI
            ================================================= */}

            <div className="profile-information">

                <div className="profile-information-header">

                    <div className="profile-information-icon">
                        @
                    </div>

                    <div>
                        <h3>
                            Podaci naloga
                        </h3>

                        <p>
                            Informacije povezane sa vašim
                            Eatery nalogom.
                        </p>
                    </div>

                </div>


                <div className="profile-information-body">

                    <div className="profile-information-item">

                        <span>
                            IME
                        </span>

                        <strong>
                            {profil.ime?.trim() ||
                                profil.korisnickoIme ||
                                'Nije uneseno'}
                        </strong>

                    </div>


                    <div className="profile-information-item">

                        <span>
                            KORISNIČKO IME
                        </span>

                        <strong>
                            @{korisnickoIme}
                        </strong>

                    </div>


                    <div className="profile-information-item">

                        <span>
                            EMAIL
                        </span>

                        <strong>
                            {email}
                        </strong>

                    </div>

                </div>

            </div>

        </section>
    );
}

export default KupacProfil;
