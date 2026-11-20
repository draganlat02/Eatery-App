import React, { useState, useEffect } from "react";
import {
  Gift,
  Leaf,
  Clock,
  TriangleAlert,
  ShoppingBag,
  Ban,
} from "lucide-react";
import API from "../api";
import { statusPreuzimanjaVrecice } from "./radnoVrijeme";
import "./HeroVrecice.css";
import { MapPin, X } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

function HeroVrecice({ onDodajUVrecicu, lokacija, lokacijaUcitana }) {
  const [vrecice, setVrecice] = useState([]);
  const [loading, setLoading] = useState(true);
const [otvorenaLokacija, setOtvorenaLokacija] = useState(null);
  // Učitavanje aktivnih Vrećica uz sortiranje po udaljenosti kupca
  useEffect(() => {
    // Sačekaj da se završi provjera lokacije kupca
    if (!lokacijaUcitana) return;

    let isMounted = true;

    setLoading(true);

    const params = lokacija
      ? {
          lat: lokacija.lat,
          lng: lokacija.lng,
        }
      : {};

    API.get("/vrecice/aktivne", { params })
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
      isMounted = false;
    };
  }, [lokacija, lokacijaUcitana]);

  return (
    <section className="surprise-section" aria-labelledby="vrecice-naslov">
      <div className="surprise-header">
        <div className="surprise-title-area">
          <span className="surprise-icon" aria-hidden="true">
            <Gift size={24} />
          </span>
          <div>
            <span className="surprise-label">Eatery special</span>
            <h2 id="vrecice-naslov">Vrećice iznenađenja</h2>
            <p>
              Spasite odličnu hranu i uživajte u obroku po znatno nižoj cijeni.
            </p>
          </div>
        </div>

        <div className="surprise-badge">
          <Leaf size={14} aria-hidden="true" /> Smanjujemo bacanje hrane
        </div>
      </div>

      {loading ? (
        <div
          className="surprise-grid"
          aria-busy="true"
          aria-label="Učitavanje vrećica"
        >
          {[0, 1, 2].map((i) => (
            <div className="surprise-card skeleton" key={i}>
              <div className="skeleton-block tall" />
              <div className="surprise-card-content">
                <div className="skeleton-block line" />
                <div className="skeleton-block line short" />
                <div className="skeleton-block button" />
              </div>
            </div>
          ))}
        </div>
      ) : vrecice.length === 0 ? (
        <div className="surprise-empty">
          <span className="surprise-empty-icon" aria-hidden="true">
            <Gift size={20} />
          </span>
          <div>
            <h3>Trenutno nema dostupnih vrećica</h3>
            <p>Nove vrećice iznenađenja biće dostupne uskoro.</p>
          </div>
        </div>
      ) : (
        <div className="surprise-grid">
          {vrecice.map((v) => {
            const staraCijena =
              Number(v.originalnaCijena ?? v.staraCijena) || 0;
            const akcijskaCijena = Number(v.akcijskaCijena) || 0;

            const usteda =
              staraCijena > 0
                ? Math.round(
                    ((staraCijena - akcijskaCijena) / staraCijena) * 100,
                  )
                : 0;

            const razlikaCijene = staraCijena - akcijskaCijena;

            const kolicina = Number(v.kolicina) || 0;
            const isRasprodano = kolicina <= 0;

            // Vremenski prozor za preuzimanje koji je definisao restoran (npr. 18:00 – 19:30)
            const imaSatnicu = Boolean(
              v.vrijemePreuzimanjaOd && v.vrijemePreuzimanjaDo,
            );
            const statusPreuzimanja = statusPreuzimanjaVrecice(
              v.vrijemePreuzimanjaOd,
              v.vrijemePreuzimanjaDo,
            );
            const preuzimanjeIsteklo = statusPreuzimanja === "isteklo";
            const nedostupno = isRasprodano || preuzimanjeIsteklo;
            const nazivRestorana =
              v.restoran?.nazivObjekta || v.restoran?.naziv;
const restoran = v.restoran;

const lat = Number(
  restoran?.latitude ??
  restoran?.lat ??
  restoran?.lokacija?.latitude ??
  restoran?.lokacija?.lat
);

const lng = Number(
  restoran?.longitude ??
  restoran?.lng ??
  restoran?.lon ??
  restoran?.lokacija?.longitude ??
  restoran?.lokacija?.lng
);

const imaLokaciju =
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat !== 0 &&
  lng !== 0;
            return (
              <article
                className={
                  nedostupno ? "surprise-card unavailable" : "surprise-card"
                }
                key={v.id}
              >
                <div className="surprise-card-top">
                  <span className="surprise-card-pattern" aria-hidden="true">
                    <Gift size={30} />
                  </span>

                  {usteda > 0 && (
                    <span className="discount-badge">-{usteda}%</span>
                  )}

                  {!isRasprodano && kolicina > 0 && kolicina <= 3 && (
                    <span className="stock-badge">Još {kolicina}</span>
                  )}
                </div>

                <div className="surprise-card-content">
                 {nazivRestorana && (
  <div className="surprise-restaurant-row">
    <span className="surprise-small-label">
      {nazivRestorana}
    </span>

    {imaLokaciju && (
      <button
        type="button"
        className="surprise-map-pin"
        onClick={() =>
          setOtvorenaLokacija({
            naziv: nazivRestorana,
            adresa: restoran?.adresa || "",
            lat,
            lng,
          })
        }
        title="Pogledaj lokaciju restorana"
        aria-label="Pogledaj lokaciju restorana"
      >
        <MapPin size={16} />
      </button>
    )}
  </div>
)}
                  <h3>{v.naziv}</h3>

                  <p className="surprise-description">
                    {v.opis ||
                      "Odabrana hrana iz restorana po posebnoj cijeni."}
                  </p>

                  {imaSatnicu && (
                    <div
                      className={`surprise-pickup ${statusPreuzimanja || ""}`}
                    >
                      <Clock size={15} aria-hidden="true" />
                      <div>
                        <strong>
                          Preuzimanje danas {v.vrijemePreuzimanjaOd} –{" "}
                          {v.vrijemePreuzimanjaDo}
                        </strong>
                        <span>
                          {statusPreuzimanja === "sada"
                            ? "U toku je, možete doći odmah"
                            : preuzimanjeIsteklo
                              ? "Za danas je završeno"
                              : "Obavijestićemo vas kad možete doći"}
                        </span>
                      </div>
                    </div>
                  )}

                  {v.alergijskaUpozorenja && (
                    <div className="surprise-allergy">
                      <TriangleAlert size={14} aria-hidden="true" />
                      <span>
                        <strong>Alergeni:</strong> {v.alergijskaUpozorenja}
                      </span>
                    </div>
                  )}

                  <div className="surprise-footer">
                    <div className="surprise-prices">
                      {staraCijena > 0 && (
                        <span className="old-price">
                          {staraCijena.toFixed(2)} KM
                        </span>
                      )}
                      <strong className="new-price">
                        {akcijskaCijena.toFixed(2)} KM
                      </strong>
                      {razlikaCijene > 0 && (
                        <span className="saving-text">
                          Ušteda {razlikaCijene.toFixed(2)} KM
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="surprise-add-button"
                      onClick={() => onDodajUVrecicu(v)}
                      disabled={nedostupno}
                    >
                      {nedostupno ? (
                        <Ban size={15} aria-hidden="true" />
                      ) : (
                        <ShoppingBag size={15} aria-hidden="true" />
                      )}
                      {isRasprodano
                        ? "Rasprodano"
                        : preuzimanjeIsteklo
                          ? "Završeno"
                          : "Dodaj u korpu"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
          )}

      {/* MODAL ZA LOKACIJU RESTORANA */}
      {otvorenaLokacija && (
        <div
          className="surprise-map-overlay"
          onClick={() => setOtvorenaLokacija(null)}
        >
          <div
            className="surprise-map-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="surprise-map-header">
              <div className="surprise-map-heading">
                <MapPin size={19} />

                <div>
                  <strong>{otvorenaLokacija.naziv}</strong>
                  <span>
                    {otvorenaLokacija.adresa || "Lokacija restorana"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="surprise-map-close"
                onClick={() => setOtvorenaLokacija(null)}
                aria-label="Zatvori mapu"
              >
                <X size={19} />
              </button>
            </div>

            <MapContainer
              key={`${otvorenaLokacija.lat}-${otvorenaLokacija.lng}`}
              center={[
                otvorenaLokacija.lat,
                otvorenaLokacija.lng,
              ]}
              zoom={16}
              scrollWheelZoom
              className="surprise-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker
                position={[
                  otvorenaLokacija.lat,
                  otvorenaLokacija.lng,
                ]}
              >
                <Popup>
                  <strong>{otvorenaLokacija.naziv}</strong>
                  <br />
                  {otvorenaLokacija.adresa}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

    </section>
  );
}
  


export default HeroVrecice;
