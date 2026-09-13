import React, { useEffect, useState } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Circle,
    useMap
} from 'react-leaflet';

import API from './api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './KupacMapa.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';


// =========================================================
// LEAFLET DEFAULT IKONA
// =========================================================

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});


// =========================================================
// MODERNE IKONE
// =========================================================

// Ikona za lokaciju kupca
const KupacIcon = L.divIcon({
    className: 'custom-map-icon-wrapper',
    html: `
        <div class="kupac-map-marker">
            <div class="kupac-map-marker-inner">
                <span>📍</span>
            </div>
        </div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 46],
    popupAnchor: [0, -46]
});


// Ikona za restoran
const RestoranIcon = L.divIcon({
    className: 'custom-map-icon-wrapper',
    html: `
        <div class="restoran-map-marker">
            <div class="restoran-map-marker-inner">
                <span>🍽️</span>
            </div>
        </div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 46],
    popupAnchor: [0, -46]
});


// =========================================================
// POMJERANJE MAPE
// =========================================================

function CentrirajMapu({ lat, lng }) {

    const map = useMap();

    useEffect(() => {

        if (lat && lng) {
            map.setView(
                [lat, lng],
                13,
                {
                    animate: true
                }
            );
        }

    }, [lat, lng, map]);

    return null;
}


// =========================================================
// GLAVNA KOMPONENTA
// =========================================================

const KupacMapa = ({ onIzaberiRestoran }) => {

    // Banja Luka fallback
    const [kupacLokacija, setKupacLokacija] = useState({
        lat: 44.7722,
        lng: 17.1910
    });

    const [restorani, setRestorani] = useState([]);

    const [loadingLokacije, setLoadingLokacije] =
        useState(true);

    const [loadingRestorana, setLoadingRestorana] =
        useState(false);

    const [greska, setGreska] = useState('');


    // =====================================================
    // INTERNI RADIJUS
    // =====================================================
    // Korisnik ga ne podešava i ne vidi ovu vrijednost.

    const RADIJUS_KM = 10;


    // =====================================================
    // 1. LOKACIJA KUPCA
    // =====================================================

    useEffect(() => {

        if (!navigator.geolocation) {

            setGreska(
                'Vaš browser ne podržava određivanje lokacije. '
                + 'Koristi se podrazumijevana lokacija.'
            );

            setLoadingLokacije(false);

            return;
        }


        navigator.geolocation.getCurrentPosition(

            (position) => {

                setKupacLokacija({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });

                setGreska('');
                setLoadingLokacije(false);
            },


            (error) => {

                console.warn(
                    'Lokacija nije dostupna:',
                    error
                );

                setGreska(
                    'Lokacija nije odobrena. '
                    + 'Koristi se podrazumijevana lokacija.'
                );

                setLoadingLokacije(false);
            },


            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );

    }, []);


    // =====================================================
    // 2. RESTORANI U BLIZINI
    // =====================================================

    useEffect(() => {

        if (
            !kupacLokacija.lat ||
            !kupacLokacija.lng
        ) {
            return;
        }


        setLoadingRestorana(true);


        API.get(
            '/restorani/u-blizini',
            {
                params: {
                    lat: kupacLokacija.lat,
                    lng: kupacLokacija.lng,

                    // INTERNI RADIJUS
                    radijusKm: RADIJUS_KM
                }
            }
        )

            .then((res) => {

                setRestorani(
                    Array.isArray(res.data)
                        ? res.data
                        : []
                );

            })

            .catch((err) => {

                console.error(
                    'Greška pri dohvatanju restorana:',
                    err
                );

                setRestorani([]);

                setGreska(
                    'Nije moguće učitati restorane u blizini.'
                );

            })

            .finally(() => {

                setLoadingRestorana(false);

            });

    }, [kupacLokacija]);


    // =====================================================
    // 3. OTVORI RESTORAN
    // =====================================================

    const otvoriRestoran = (restoran) => {

        if (onIzaberiRestoran) {
            onIzaberiRestoran(restoran);
        }

    };


    // =====================================================
    // 4. RENDER
    // =====================================================

    return (

        <section className="kupac-mapa-section">


            {/* =================================================
                HEADER
               ================================================= */}

            <div className="kupac-mapa-header">

                <div>

                    <span className="kupac-mapa-eyebrow">
                        ISTRAŽITE PONUDU
                    </span>

                    <h2>
                        Restorani u vašoj blizini
                    </h2>

                    <p>
                        Pronađite restorane u svojoj okolini
                        i pogledajte njihovu ponudu.
                    </p>

                </div>


                <div className="kupac-mapa-counter">

                    <span className="kupac-mapa-counter-icon">
                        🍽️
                    </span>

                    <div>

                        <strong>
                            {restorani.length}
                        </strong>

                        <span>
                            restorana
                        </span>

                    </div>

                </div>

            </div>


            {/* =================================================
                PORUKA
               ================================================= */}

            {greska && (

                <div className="kupac-mapa-message">

                    <span>
                        ⚠️
                    </span>

                    {greska}

                </div>

            )}


            {/* =================================================
                STATUS
               ================================================= */}

            {loadingRestorana && (

                <div className="kupac-mapa-loading">

                    <div className="kupac-map-spinner" />

                    <span>
                        Pronalazimo restorane u vašoj blizini...
                    </span>

                </div>

            )}


            {/* =================================================
                MAPA
               ================================================= */}

            <div className="kupac-map-container">

                <MapContainer
                    center={[
                        kupacLokacija.lat,
                        kupacLokacija.lng
                    ]}
                    zoom={13}
                    scrollWheelZoom={true}
                    className="kupac-leaflet-map"
                >

                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />


                    <CentrirajMapu
                        lat={kupacLokacija.lat}
                        lng={kupacLokacija.lng}
                    />


                    {/* =========================================
                        LOKACIJA KUPCA
                       ========================================= */}

                    <Marker
                        position={[
                            kupacLokacija.lat,
                            kupacLokacija.lng
                        ]}
                        icon={KupacIcon}
                    >

                        <Popup
                            className="premium-map-popup"
                        >

                            <div className="map-popup-content">

                                <div className="map-popup-icon kupac-popup-icon">
                                    📍
                                </div>

                                <div>

                                    <strong>
                                        Vaša lokacija
                                    </strong>

                                    <span>
                                        Trenutna pozicija
                                    </span>

                                </div>

                            </div>

                        </Popup>

                    </Marker>


                    {/* =========================================
                        RADIJUS
                       ========================================= */}

                    <Circle
                        center={[
                            kupacLokacija.lat,
                            kupacLokacija.lng
                        ]}
                        radius={
                            RADIJUS_KM * 1000
                        }
                        pathOptions={{
                            className:
                                'kupac-radius-circle',
                            color: '#111827',
                            fillColor: '#111827',
                            fillOpacity: 0.045,
                            weight: 1,
                            opacity: 0.25
                        }}
                    />


                    {/* =========================================
                        RESTORANI
                       ========================================= */}

                    {restorani.map((restoran) => (

                        <Marker
                            key={restoran.id}
                            position={[
                                restoran.lat,
                                restoran.lng
                            ]}
                            icon={RestoranIcon}
                        >

                            <Popup
                                className="premium-map-popup"
                            >

                                <div className="restaurant-map-popup">

                                    <div className="restaurant-popup-icon">
                                        🍽️
                                    </div>

                                    <div className="restaurant-popup-body">

                                        <h3>
                                            {restoran.naziv ||
                                                'Restoran'}
                                        </h3>

                                        <div className="restaurant-popup-address">

                                            <span>
                                                📍
                                            </span>

                                            <span>
                                                {restoran.adresa ||
                                                    'Adresa nije unesena'}
                                            </span>

                                        </div>

                                        <div className="restaurant-popup-distance">

                                            <span>
                                                Udaljenost
                                            </span>

                                            <strong>
                                                {Number(
                                                    restoran.udaljenostKm
                                                ).toFixed(1)}
                                                {' '}km
                                            </strong>

                                        </div>


                                        <button
                                            className="map-popup-button"
                                            onClick={() =>
                                                otvoriRestoran(
                                                    restoran
                                                )
                                            }
                                        >

                                            Pogledaj ponudu

                                            <span>
                                                →
                                            </span>

                                        </button>

                                    </div>

                                </div>

                            </Popup>

                        </Marker>

                    ))}

                </MapContainer>


                {/* MAP OVERLAY */}

                <div className="map-location-badge">

                    <span className="map-location-badge-dot" />

                    Lokacija aktivna

                </div>

            </div>


            {/* =================================================
                NEMA RESTORANA
               ================================================= */}

            {!loadingRestorana &&
                !loadingLokacije &&
                restorani.length === 0 && (

                    <div className="kupac-map-empty">

                        <div className="kupac-map-empty-icon">
                            🍽️
                        </div>

                        <div>

                            <h3>
                                Nema restorana u vašoj blizini
                            </h3>

                            <p>
                                Trenutno nema registrovanih restorana
                                koji imaju postavljenu lokaciju.
                            </p>

                        </div>

                    </div>

                )
            }


            {/* =================================================
                KARTICE ISPOD MAPE
               ================================================= */}

            {!loadingRestorana &&
                restorani.length > 0 && (

                    <div className="kupac-map-results">

                        <div className="kupac-map-results-header">

                            <div>

                                <span>
                                    PRONAĐENO
                                </span>

                                <h3>
                                    Restorani u blizini
                                </h3>

                            </div>

                        </div>


                        <div className="kupac-map-restaurant-grid">

                            {restorani.map((restoran) => (

                                <article
                                    className="kupac-map-restaurant-card"
                                    key={restoran.id}
                                    onClick={() =>
                                        otvoriRestoran(
                                            restoran
                                        )
                                    }
                                >

                                    <div className="map-card-icon">
                                        🍽️
                                    </div>


                                    <div className="map-card-info">

                                        <h4>
                                            {restoran.naziv ||
                                                'Restoran'}
                                        </h4>

                                        <p className="map-card-address">

                                            <span>
                                                📍
                                            </span>

                                            {restoran.adresa ||
                                                'Adresa nije unesena'}

                                        </p>


                                        <div className="map-card-bottom">

                                            <span className="map-card-distance">

                                                <span>
                                                    ↗
                                                </span>

                                                {Number(
                                                    restoran.udaljenostKm
                                                ).toFixed(1)}
                                                {' '}km

                                            </span>


                                            <button
                                                onClick={(e) => {

                                                    e.stopPropagation();

                                                    otvoriRestoran(
                                                        restoran
                                                    );

                                                }}
                                            >

                                                Pogledaj meni

                                                <span>
                                                    →
                                                </span>

                                            </button>

                                        </div>

                                    </div>

                                </article>

                            ))}

                        </div>

                    </div>

                )}

        </section>
    );
};


export default KupacMapa;