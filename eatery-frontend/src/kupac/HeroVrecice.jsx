
import React, { useState, useEffect } from 'react';
import API from '../api';
import './HeroVrecice.css';

function HeroVrecice({ onDodajUVrecicu }) {
    const [vrecice, setVrecice] = useState([]);

    // Učitavanje aktivnih vrećica sa backenda
    useEffect(() => {
        API.get('/vrecice/aktivne')
            .then(res => setVrecice(res.data))
            .catch(err =>
                console.error(
                    "Greška pri učitavanju vrećica:",
                    err
                )
            );
    }, []);

    return (
        <section className="surprise-section">

            {/* HEADER */}
            <div className="surprise-header">

                <div className="surprise-title-area">

                    <div className="surprise-icon">
                        🎁
                    </div>

                    <div>
                        <span className="surprise-label">
                            EATERY SPECIAL
                        </span>

                        <h2>
                            Vrećice iznenađenja
                        </h2>

                        <p>
                            Spasite odličnu hranu i uživajte u
                            obroku po znatno nižoj cijeni.
                        </p>
                    </div>

                </div>

                <div className="surprise-badge">
                    <span>♻</span>
                    Smanjujemo bacanje hrane
                </div>

            </div>


            {/* VRECICE */}
            {vrecice.length === 0 ? (

                <div className="surprise-empty">

                    <div className="surprise-empty-icon">
                        🎁
                    </div>

                    <div>
                        <h3>
                            Trenutno nema dostupnih vrećica
                        </h3>

                        <p>
                            Nove vrećice iznenađenja biće
                            dostupne uskoro.
                        </p>
                    </div>

                </div>

            ) : (

                <div className="surprise-grid">

                    {vrecice.map(v => {

                        const staraCijena =
                            Number(v.staraCijena) || 0;

                        const akcijskaCijena =
                            Number(v.akcijskaCijena) || 0;

                        const usteda =
                            staraCijena > 0
                                ? Math.round(
                                      ((staraCijena -
                                          akcijskaCijena) /
                                          staraCijena) *
                                          100
                                  )
                                : 0;

                        return (
                            <article
                                className="surprise-card"
                                key={v.id}
                            >

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

                                            <h3>
                                                {v.naziv}
                                            </h3>
                                        </div>

                                    </div>


                                    <p className="surprise-description">
                                        {v.opis ||
                                            'Odabrana hrana iz restorana po posebnoj cijeni.'}
                                    </p>


                                    {/* PRICE */}
                                    <div className="surprise-price-row">

                                        <div className="surprise-prices">

                                            <span className="old-price">
                                                {staraCijena.toFixed(2)} KM
                                            </span>

                                            <strong className="new-price">
                                                {akcijskaCijena.toFixed(2)} KM
                                            </strong>

                                        </div>

                                        {usteda > 0 && (
                                            <span className="saving-text">
                                                Ušteda {(
                                                    staraCijena -
                                                    akcijskaCijena
                                                ).toFixed(2)} KM
                                            </span>
                                        )}

                                    </div>


                                    {/* BUTTON */}
                                    <button
                                        className="surprise-add-button"
                                        onClick={() =>
                                            onDodajUVrecicu(v)
                                        }
                                    >
                                        <span className="bag-icon">
                                            🛒
                                        </span>

                                        Dodaj u korpu

                                        <span className="button-arrow">
                                            →
                                        </span>
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

