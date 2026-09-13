import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import API from './api';
import L from 'leaflet';
import axios from 'axios';

// Leaflet CSS i popravka ikone pina
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Pomoćna komponenta za re-centriranje mape kada se koordinate promijene
function CentrirajMapu({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat !== 0 && lng !== 0) {
            map.setView([lat, lng], 16);
        }
    }, [lat, lng, map]);
    return null;
}

// Komponenta za obradu klika na mapu
function KlikNaMapuHandler({ onSelectCoordinates }) {
    useMapEvents({
        click(e) {
            onSelectCoordinates(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

const KlijentProfil = () => {
    const [profil, setProfil] = useState({ adresa: '', lat: 0, lng: 0 });
    const [novaAdresa, setNovaAdresa] = useState('');
    const [korisnikInfo, setKorisnikInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [poruka, setPoruka] = useState('');
    const [greska, setGreska] = useState('');
    const [saving, setSaving] = useState(false);

    // Flag koji spriječava da se prekucava adresa dok korisnik vuče pin
    const isManualPinMove = useRef(false);
    const markerRef = useRef(null);

    useEffect(() => {
        let korisnikData = null;

        try {
            const sacuvano = localStorage.getItem('user') || localStorage.getItem('korisnik');
            if (sacuvano) {
                korisnikData = JSON.parse(sacuvano);
                setKorisnikInfo(korisnikData);
            }
        } catch (e) {
            console.error("Greška pri čitanju korisnika:", e);
        }

        if (!korisnikData || !korisnikData.id) {
            setGreska("Niste prijavljeni ili ID korisnika nije pronađen.");
            setLoading(false);
            return;
        }

        // Učitavanje postojeće lokacije
        API.get(`/restorani/${korisnikData.id}/lokacija`)
            .then(res => {
                if (res.data) {
                    setProfil(res.data);
                    if (res.data.adresa) {
                        setNovaAdresa(res.data.adresa);
                    }
                }
            })
            .catch(err => {
                console.warn("Restoran još nema unesenu lokaciju:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // 1. AUTOMATSKO POMJERANJE PINA KADA KORISNIK UTIPKA ADRESU (Debounce 700ms)
    useEffect(() => {
        // Ako je korisnik sam pomjerio pin klikom/prevlačenjem, preskačemo geokodiranje teksta
        if (isManualPinMove.current) {
            isManualPinMove.current = false;
            return;
        }

        if (!novaAdresa || novaAdresa.trim().length < 3) return;

        const timer = setTimeout(async () => {
            try {
                const res = await axios.get(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(novaAdresa)}`
                );
                if (res.data && res.data.length > 0) {
                    const prviRezultat = res.data[0];
                    const newLat = parseFloat(prviRezultat.lat);
                    const newLng = parseFloat(prviRezultat.lon);

                    setProfil(prev => ({
                        ...prev,
                        lat: newLat,
                        lng: newLng
                    }));
                }
            } catch (err) {
                console.warn("Greška pri automatskom pronalasku adrese na mapi:", err);
            }
        }, 700); // Čeka 700ms nakon što korisnik prestane kucati

        return () => clearTimeout(timer);
    }, [novaAdresa]);

    // 2. REVERSE GEOCODING (Iz koordinata u naziv adrese pri kliku/prevlačenju pina)
    const azurirajAdresuPrekoKoordinata = async (lat, lng) => {
        try {
            const res = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            if (res.data && res.data.display_name) {
                isManualPinMove.current = true; // Oznaka da je promjena potekla sa mape
                setNovaAdresa(res.data.display_name);
            }
        } catch (e) {
            console.warn("Nije moguće preuzeti naziv adrese za izabrane koordinate", e);
        }
    };

    // Rukovanje kada klijent klikne na mapu
    const handleMapClick = (noviLat, noviLng) => {
        isManualPinMove.current = true;
        setProfil(prev => ({ ...prev, lat: noviLat, lng: noviLng }));
        azurirajAdresuPrekoKoordinata(noviLat, noviLng);
    };

    // Rukovanje kada klijent prevuče pin (Drag and Drop)
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    isManualPinMove.current = true;
                    setProfil(prev => ({ ...prev, lat, lng }));
                    azurirajAdresuPrekoKoordinata(lat, lng);
                }
            },
        }),
        [],
    );

    const handleSpremiLokaciju = async (e) => {
        if (e) e.preventDefault();
        setPoruka('');
        setGreska('');

        if (!novaAdresa.trim()) {
            setGreska("Molimo unesite adresu.");
            return;
        }

        setSaving(true);

        try {
            const res = await API.put(`/restorani/${korisnikInfo.id}/lokacija`, {
                adresa: novaAdresa,
                lat: profil.lat !== 0 ? profil.lat : null,
                lng: profil.lng !== 0 ? profil.lng : null
            });

            setProfil({
                adresa: res.data.adresa,
                lat: res.data.lat,
                lng: res.data.lng
            });

            setPoruka("Lokacija je uspješno sačuvana!");
        } catch (err) {
            console.error("Greška pri čuvanju lokacije:", err);

            let errData = err.response?.data;
            if (typeof errData === 'object' && errData !== null) {
                setGreska(errData.poruka || errData.message || JSON.stringify(errData));
            } else if (typeof errData === 'string') {
                setGreska(errData);
            } else {
                setGreska("Došlo je do greške pri određivanju lokacije.");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Učitavanje profila...</div>;
    }

    const mapCenter = (profil.lat !== 0 && profil.lng !== 0) 
        ? [profil.lat, profil.lng] 
        : [44.77218, 17.19100];

    return (
        <div style={{ maxWidth: '650px', margin: '30px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'Arial, sans-serif' }}>
            <h2>Profil Restorana</h2>

            {korisnikInfo && (
                <div style={{ marginBottom: '20px', background: '#f9f9f9', padding: '15px', borderRadius: '5px' }}>
                    <p><strong>Korisničko ime:</strong> {korisnikInfo.korisnickoIme}</p>
                    <p><strong>Email:</strong> {korisnikInfo.email}</p>
                    <p><strong>Uloga:</strong> {korisnikInfo.uloga}</p>
                </div>
            )}

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

            <h3>Unos / Ažuriranje Lokacije</h3>
            
            <p>
                <strong>Trenutna adresa:</strong>{' '}
                {profil.adresa ? (
                    <span style={{ color: 'green', fontWeight: 'bold' }}>{profil.adresa}</span>
                ) : (
                    <span style={{ color: '#888' }}>Lokacija još uvijek nije unesena.</span>
                )}
            </p>

            {profil.lat !== 0 && profil.lng !== 0 && (
                <p style={{ fontSize: '0.9em', color: '#555' }}>
                    <strong>Koordinate:</strong> Lat: {profil.lat.toFixed(6)}, Lng: {profil.lng.toFixed(6)}
                </p>
            )}

            <form onSubmit={handleSpremiLokaciju} style={{ marginTop: '15px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Unesite novu adresu ili izaberite na mapi:</label>
                    <input
                        type="text"
                        value={novaAdresa}
                        onChange={(e) => setNovaAdresa(e.target.value)}
                        placeholder="Unesite adresu restorana (npr. Banja Luka, Kralja Petra I)..."
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    />
                </div>

                {poruka && <p style={{ color: 'green', fontWeight: 'bold' }}>{poruka}</p>}
                {greska && <p style={{ color: 'red', fontWeight: 'bold' }}>{String(greska)}</p>}

                <button 
                    type="submit" 
                    disabled={saving}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        marginBottom: '15px'
                    }}
                >
                    {saving ? 'Spremanje...' : 'Sačuvaj adresu'}
                </button>
            </form>

            {/* MAPA SA PREVLAČENJEM I AUTOMATSKIM PINA */}
            <div style={{ marginTop: '10px' }}>
                <p style={{ fontSize: '0.85em', color: '#666', marginBottom: '5px' }}>
                    📍 <i>Kucanjem adrese pin se automatski pomjera. Takođe možete prevući pin ili kliknuti bilo gdje na mapu.</i>
                </p>
                <div style={{ height: '350px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
                    <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <CentrirajMapu lat={profil.lat} lng={profil.lng} />
                        <KlikNaMapuHandler onSelectCoordinates={handleMapClick} />
                        
                        {(profil.lat !== 0 || profil.lng !== 0) && (
                            <Marker 
                                draggable={true} 
                                eventHandlers={eventHandlers} 
                                position={[profil.lat !== 0 ? profil.lat : 44.77218, profil.lng !== 0 ? profil.lng : 17.19100]} 
                                ref={markerRef}
                            >
                                <Popup>
                                    <strong>{korisnikInfo?.korisnickoIme || 'Restoran'}</strong><br />
                                    {novaAdresa || 'Izabrana lokacija'}
                                </Popup>
                            </Marker>
                        )}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default KlijentProfil;