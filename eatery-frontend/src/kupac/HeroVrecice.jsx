import React, { useState, useEffect } from 'react';
import API from '../api';
import './HeroVrecice.css';

function HeroVrecice({ onDodajUVrecicu }) {
    const [vrecice, setVrecice] = useState([]);
    const [loading, setLoading] = useState(true);

    // Učitavanje aktivnih vrećica sa backenda
    useEffect(() => {
        let isMounted = true;

        API.get('/vrecice/aktivne')
            .then((res) => {
                if (isMounted) {
                    setVrecice(Array.isArray(res.data) ? res.data : []);
                    setLoading(false);
                }
            })
            .catch((err) => {
                console.error("Greška pri učitavanju vrećica:", err);
                if (isMounted) {
                    setVrecice([]);
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false; // Sprječava update stanja ako se komponenta unmount-uje
        };
    }, []);

    if (loading) {
        return (
            <section className="surprise-section">
                <div className="surprise-loading">
                    <div className="surprise-spinner" />
                    <p>Učitavanje vrećica iznenađenja...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="surprise-section">
            {/* HEADER */}
            <div className="surprise-header">
                <div className="surprise-title-area">
                    <div className="surprise-icon">🎁</div>

                    <div>
                        <span className="surprise-label">EATERY SPECIAL</span>
                        <h2>Vrećice iznenađenja</h2>
                        <p>
                            Spasite odličnu hranu i uživajte u obroku po znatno nižoj cijeni.
                        </p>
                    </div>
                </div>

                <div className="surprise-badge">
                    <span>♻</span> Smanjujemo bacanje hrane
                </div>
            </div>

            {/* VRECICE LISTA / EMPTY STATE */}
            {vrecice.length === 0 ? (
                <div className="surprise-empty">
                    <div className="surprise-empty-icon">🎁</div>
                    <div>
                        <h3>Trenutno nema dostupnih vrećica</h3>
                        <p>Nove vrećice iznenađenja biće dostupne uskoro.</p>
                    </div>
                </div>
            ) : (
                <div className="surprise-grid">
                    {vrecice.map((v) => {
                        const staraCijena = Number(v.staraCijena) || 0;
                        const akcijskaCijena = Number(v.akcijskaCijena) || 0;

                        const usteda =
                            staraCijena > 0
                                ? Math.round(
                                      ((staraCijena - akcijskaCijena) / staraCijena) * 100
                                  )
                                : 0;

                        const razlikaCijene = staraCijena - akcijskaCijena;

                        // Provjera preostale količine (prilagodi naziv polja sa API-ja ako je npr. v.zaliha)
                        const kolicina = Number(v.kolicina) || 0;
                        const isRasprodano = kolicina <= 0;

                        return (
                            <article className="surprise-card" key={v.id}>
                                {/* IMAGE / ICON AREA */}
                                <div className="surprise-card-top">
                                    <div className="surprise-card-pattern">
                                        <span>🎁</span>
                                    </div>

                                    {usteda > 0 && (
                                        <div className="discount-badge">
                                            -{usteda}%
                                        </div>
                                    )}
                                </div>

                                {/* CONTENT */}
                                <div className="surprise-card-content">
                                    <div className="surprise-card-heading">
                                        <div>
                                            <span className="surprise-small-label">
                                                VREĆICA IZNENAĐENJA
                                            </span>
                                            <h3>{v.naziv}</h3>
                                        </div>
                                    </div>

                                    <p className="surprise-description">
                                        {v.opis ||
                                            'Odabrana hrana iz restorana po posebnoj cijeni.'}
                                    </p>

                                    {v.alergijskaUpozorenja && (
                                        <div className="surprise-allergy">
                                            <strong>Alergijsko upozorenje:</strong>
                                            <span>{v.alergijskaUpozorenja}</span>
                                        </div>
                                    )}

                                    {/* PRICE */}
                                    <div className="surprise-price-row">
                                        <div className="surprise-prices">
                                            {staraCijena > 0 && (
                                                <span className="old-price">
                                                    {staraCijena.toFixed(2)} KM
                                                </span>
                                            )}

                                            <strong className="new-price">
                                                {akcijskaCijena.toFixed(2)} KM
                                            </strong>
                                        </div>

                                        {razlikaCijene > 0 && (
                                            <span className="saving-text">
                                                Ušteda {razlikaCijene.toFixed(2)} KM
                                            </span>
                                        )}
                                    </div>

                                    {/* BUTTON */}
                                    <button
                                        className={`surprise-add-button ${
                                            isRasprodano ? 'disabled' : ''
                                        }`}
                                        onClick={() => onDodajUVrecicu(v)}
                                        disabled={isRasprodano}
                                    >
                                        <span className="bag-icon">
                                            {isRasprodano ? '🚫' : '🛒'}
                                        </span>

                                        {isRasprodano ? 'Rasprodano' : 'Dodaj u korpu'}

                                        {!isRasprodano && (
                                            <span className="button-arrow">→</span>
                                        )}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default HeroVrecice;