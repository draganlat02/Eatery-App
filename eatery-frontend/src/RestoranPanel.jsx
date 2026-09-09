import React, { useState, useEffect } from "react";
import axios from "axios";

const RestoranPanel = ({ restoranId, user }) => {
  // Izvuci ID restorana iz prosleđenih rekvizita ili ulogovanog korisnika
  const stvarniRestoranId = restoranId || user?.id || user?.idKorisnika;

  // Stanja za narudžbe i vrećice
  const [vrecice, setVrecice] = useState([]);
  const [narudzbe, setNarudzbe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingNarudzbe, setLoadingNarudzbe] = useState(false);

  // Stanja za kategorije i jela
  const [kategorije, setKategorije] = useState([]);
  const [jela, setJela] = useState([]);
  const [novaKategorija, setNovaKategorija] = useState("");
  const [novoJelo, setNovoJelo] = useState({
    naziv: "",
    opis: "",
    cijena: "",
    kategorijaId: ""
  });

  // Forma za vrećicu iznenađenja
  const pocetnaForma = {
    naziv: "Vrećica Iznenađenja",
    opis: "Ukusna kombinacija naših današnjih specijaliteta po akcijskoj cijeni!",
    originalnaCijena: "",
    akcijskaCijena: "",
    kolicina: 1,
    vrijemePreuzimanjaOd: "20:00",
    vrijemePreuzimanjaDo: "21:30",
    aktivna: true,
  };

  const [forma, setForma] = useState(pocetnaForma);

  // 1. Učitavanje vrećica iznenađenja
  const ucitajVrecice = async () => {
    if (!stvarniRestoranId) return;
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8000/api/vrecice/restoran/${stvarniRestoranId}`);
      setVrecice(res.data);
    } catch (err) {
      console.error("Greška pri učitavanju vrećica:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Učitavanje pristiglih narudžbi
  const ucitajNarudzbe = async () => {
    if (!stvarniRestoranId) return;
    try {
      setLoadingNarudzbe(true);
      const res = await axios.get(`http://localhost:8000/api/restoran/${stvarniRestoranId}/narudzbe`);
      setNarudzbe(res.data);
    } catch (err) {
      console.error("Greška pri učitavanju narudžbi:", err);
    } finally {
      setLoadingNarudzbe(false);
    }
  };

  // 3. Učitavanje kategorija i jela
  const ucitajKategorijeIJela = async () => {
    if (!stvarniRestoranId) return;
    try {
      const resKat = await axios.get(`http://localhost:8000/api/restoran/${stvarniRestoranId}/kategorije`);
      setKategorije(resKat.data);

      if (resKat.data.length > 0) {
        setNovoJelo((prev) => ({ ...prev, kategorijaId: resKat.data[0].id }));
      }

      const resJela = await axios.get(`http://localhost:8000/api/restoran/${stvarniRestoranId}/jela`);
      setJela(resJela.data);
    } catch (err) {
      console.error("Greška pri učitavanju kategorija/jela:", err);
    }
  };

  // Inicijalno učitavanje podataka
  useEffect(() => {
    if (stvarniRestoranId) {
      ucitajVrecice();
      ucitajNarudzbe();
      ucitajKategorijeIJela();
    }
  }, [stvarniRestoranId]);

  // Polling za narudžbe svakih 5 sekundi
  useEffect(() => {
    if (!stvarniRestoranId) return;
    const intervalId = setInterval(() => {
      ucitajNarudzbe();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [stvarniRestoranId]);

  // Dodavanje kategorije
  const handleDodajKategoriju = async (e) => {
    e.preventDefault();
    if (!novaKategorija.trim()) return;

    try {
      await axios.post(`http://localhost:8000/api/restoran/${stvarniRestoranId}/kategorije`, {
        naziv: novaKategorija
      });
      alert("Kategorija uspešno dodata!");
      setNovaKategorija("");
      ucitajKategorijeIJela();
    } catch (err) {
      console.error("Greška pri dodavanju kategorije:", err);
      alert("Greška pri dodavanju kategorije.");
    }
  };

  // Dodavanje jela
  const handleDodajJelo = async (e) => {
    e.preventDefault();
    if (!novoJelo.naziv || !novoJelo.cijena || !novoJelo.kategorijaId) {
      alert("Molimo popunite sva obavezna polja za jelo!");
      return;
    }

    try {
      await axios.post(`http://localhost:8000/api/restoran/${stvarniRestoranId}/jela`, {
        naziv: novoJelo.naziv,
        opis: novoJelo.opis,
        cijena: parseFloat(novoJelo.cijena),
        kategorijaId: parseInt(novoJelo.kategorijaId, 10)
      });
      alert("Jelo uspešno dodato na meni!");
      setNovoJelo({ naziv: "", opis: "", cijena: "", kategorijaId: kategorije[0]?.id || "" });
      ucitajKategorijeIJela();
    } catch (err) {
      console.error("Greška pri dodavanju jela:", err);
      alert("Greška pri dodavanju jela.");
    }
  };

  // Rukovanje formom za vrećicu
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForma({ ...forma, [name]: type === "checkbox" ? checked : value });
  };

  // Slanje forme za vrećicu
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stvarniRestoranId) {
      alert("Greška: Nije pronađen ID restorana!");
      return;
    }

    const payload = {
      naziv: forma.naziv,
      opis: forma.opis,
      originalnaCijena: parseFloat(forma.originalnaCijena),
      akcijskaCijena: parseFloat(forma.akcijskaCijena),
      kolicina: parseInt(forma.kolicina, 10),
      vrijemePreuzimanjaOd: forma.vrijemePreuzimanjaOd,
      vrijemePreuzimanjaDo: forma.vrijemePreuzimanjaDo,
      aktivna: forma.aktivna
    };

    try {
      await axios.post(`http://localhost:8000/api/vrecice/restoran/${stvarniRestoranId}`, payload);
      alert("🎉 Vrećica iznenađenja je uspešno kreirana!");
      setForma(pocetnaForma);
      ucitajVrecice();
    } catch (err) {
      console.error("Greška pri kreiranju vrećice:", err);
      alert("Greška prilikom kreiranja vrećice.");
    }
  };

  const PromijeniStatus = async (vrecicaId, trenutniStatus) => {
    try {
      await axios.put(`http://localhost:8000/api/vrecice/${vrecicaId}/status?aktivna=${!trenutniStatus}`);
      ucitajVrecice();
    } catch (err) {
      console.error("Greška pri promjeni statusa vrećice:", err);
    }
  };

  const azurirajKolicinu = async (vrecicaId, novaKolicina) => {
    if (novaKolicina < 0) return;
    try {
      await axios.put(`http://localhost:8000/api/vrecice/${vrecicaId}/kolicina?kolicina=${novaKolicina}`);
      ucitajVrecice();
    } catch (err) {
      console.error("Greška pri ažuriranju količine:", err);
    }
  };

  const PromijeniStatusNarudzbe = async (narudzbaId, noviStatus) => {
    try {
      await axios.put(`http://localhost:8000/api/restoran/narudzba/${narudzbaId}/status`, noviStatus, {
        headers: { "Content-Type": "text/plain" }
      });
      ucitajNarudzbe();
    } catch (err) {
      console.error("Greška pri promjeni statusa narudžbe:", err);
    }
  };

  const noveNarudzbeBroj = narudzbe.filter(n => !n.status || n.status === "ZAPRIMLJENO").length;

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <h2>🏪 Restoranski Panel</h2>

      {/* Dijagnostički prikaz */}
      <div style={{ background: "#e9ecef", padding: "10px", borderRadius: "5px", marginBottom: "15px" }}>
        <strong>Dijagnostika ID-a:</strong> Restoran ID je{" "}
        <span style={{ color: stvarniRestoranId ? "green" : "red", fontWeight: "bold" }}>
          {stvarniRestoranId ? stvarniRestoranId : "NIJE PRONAĐEN (undefined)"}
        </span>
      </div>

      {/* --- SEKCIJA 1: PRIMLJENE NARUDŽBE --- */}
      <div style={{ marginBottom: "40px", background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #ddd" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0 }}>
            📋 Primljene Narudžbe {noveNarudzbeBroj > 0 && `(${noveNarudzbeBroj} nove!)`}
          </h3>
          <button onClick={ucitajNarudzbe}>🔄 Osveži</button>
        </div>

        {narudzbe.length === 0 ? (
          <p style={{ color: "#777" }}>Nema pristiglih narudžbi.</p>
        ) : (
          narudzbe.map((n) => (
            <div key={n.id} style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "10px", borderRadius: "8px" }}>
              <h4>Narudžba #{n.id} - Status: {n.status || "ZAPRIMLJENO"}</h4>
              <p>Adresa: {n.adresaDostave}</p>
              <p>Ukupna cena: <strong>{n.ukupnaCijena} KM</strong></p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => PromijeniStatusNarudzbe(n.id, "U_PRIPREMI")}>U pripremi</button>
                <button onClick={() => PromijeniStatusNarudzbe(n.id, "SPREMNO")}>Spremno</button>
                <button onClick={() => PromijeniStatusNarudzbe(n.id, "DOSTAVLJENO")}>Dostavljeno</button>
              </div>
            </div>
          ))
        )}
      </div>

      <hr style={{ margin: "30px 0" }} />

      {/* --- SEKCIJA 2: UPRAVLJANJE KATEGORIJAMA I JELIMA --- */}
      <h3>🍕 Upravljanje Meni-jem</h3>

      {/* DODAVANJE KATEGORIJE */}
      <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #ddd" }}>
        <h4>Dodaj Novu Kategoriju</h4>
        <form onSubmit={handleDodajKategoriju} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Naziv kategorije (npr. Pizze)"
            value={novaKategorija}
            onChange={(e) => setNovaKategorija(e.target.value)}
            required
            style={{ flex: 1, padding: "8px" }}
          />
          <button type="submit" style={{ padding: "8px 15px", background: "#007bff", color: "#fff", border: "none" }}>
            Dodaj
          </button>
        </form>
      </div>

      {/* DODAVANJE JELA */}
      <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "10px", marginBottom: "30px", border: "1px solid #ddd" }}>
        <h4>Dodaj Novo Jelo</h4>
        <form onSubmit={handleDodajJelo}>
          <div style={{ marginBottom: "10px" }}>
            <label>Kategorija:</label>
            <select
              value={novoJelo.kategorijaId}
              onChange={(e) => setNovoJelo({ ...novoJelo, kategorijaId: e.target.value })}
              required
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            >
              <option value="">-- Izaberi kategoriju --</option>
              {kategorije.map((kat) => (
                <option key={kat.id} value={kat.id}>{kat.naziv}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Naziv jela:</label>
            <input
              type="text"
              value={novoJelo.naziv}
              onChange={(e) => setNovoJelo({ ...novoJelo, naziv: e.target.value })}
              required
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Opis / Sastojci:</label>
            <textarea
              value={novoJelo.opis}
              onChange={(e) => setNovoJelo({ ...novoJelo, opis: e.target.value })}
              rows="2"
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Cijena (KM):</label>
            <input
              type="number"
              step="0.01"
              value={novoJelo.cijena}
              onChange={(e) => setNovoJelo({ ...novoJelo, cijena: e.target.value })}
              required
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>

          <button type="submit" style={{ padding: "10px 20px", background: "#28a745", color: "#fff", border: "none", borderRadius: "5px" }}>
            Sačuvaj Jelo
          </button>
        </form>
      </div>

      {/* PREGLED JELA */}
      <h4>Postojeći Meni</h4>
      {jela.length === 0 ? (
        <p style={{ color: "#777" }}>Nema unesenih jela na meniju.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {jela.map((jelo) => (
            <div key={jelo.id} style={{ border: "1px solid #eee", padding: "12px", borderRadius: "6px", background: "#fff" }}>
              <strong>{jelo.naziv}</strong> - <span style={{ color: "#28a745" }}>{jelo.cijena} KM</span>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#666" }}>{jelo.opis}</p>
            </div>
          ))}
        </div>
      )}

      <hr style={{ margin: "30px 0" }} />

      {/* --- SEKCIJA 3: VREĆICE IZNENAĐENJA --- */}
      <h3>🎁 Upravljanje Vrećicama Iznenađenja</h3>

      <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "10px", border: "1px solid #ddd", marginBottom: "30px" }}>
        <h4>Dodaj Novu Vrećicu Iznenađenja</h4>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "10px" }}>
            <label>Naziv vrećice:</label>
            <input type="text" name="naziv" value={forma.naziv} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Opis:</label>
            <textarea name="opis" value={forma.opis} onChange={handleChange} rows="2" style={{ width: "100%", padding: "8px" }} />
          </div>

          <div style={{ display: "flex", gap: "15px", marginBottom: "10px" }}>
            <div style={{ flex: 1 }}>
              <label>Originalna cena (KM):</label>
              <input type="number" step="0.01" name="originalnaCijena" value={forma.originalnaCijena} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Akcijska cena (KM):</label>
              <input type="number" step="0.01" name="akcijskaCijena" value={forma.akcijskaCijena} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Količina:</label>
              <input type="number" name="kolicina" value={forma.kolicina} onChange={handleChange} min="1" required style={{ width: "100%", padding: "8px" }} />
            </div>
          </div>

          <button type="submit" style={{ background: "#28a745", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "5px" }}>
            Objavi Vrećicu
          </button>
        </form>
      </div>

      <h4>Moje Objavljene Vrećice</h4>
      {vrecice.length === 0 ? (
        <p>Trenutno nemate objavljenih vrećica.</p>
      ) : (
        vrecice.map((v) => (
          <div key={v.id} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "15px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ margin: 0 }}>{v.naziv}</h4>
              <p style={{ margin: "5px 0" }}>{v.opis}</p>
              <div>Cijena: <span style={{ textDecoration: "line-through" }}>{v.originalnaCijena} KM</span> <strong>{v.akcijskaCijena} KM</strong></div>
            </div>
            <div>
              <button onClick={() => azurirajKolicinu(v.id, v.kolicina - 1)}>-</button>
              <span style={{ margin: "0 10px" }}>{v.kolicina}</span>
              <button onClick={() => azurirajKolicinu(v.id, v.kolicina + 1)}>+</button>
              <button onClick={() => PromijeniStatus(v.id, v.aktivna)} style={{ marginLeft: "10px" }}>
                {v.aktivna ? "Deaktiviraj" : "Aktiviraj"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RestoranPanel;