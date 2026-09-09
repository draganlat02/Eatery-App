import React, { useState, useEffect } from 'react';
import Login from './Login';
import RegisterKupac from './RegistarKupac';
import AdminPanel from './AdminPanel';
import RestoranPanel from './RestoranPanel';
import KupacPanel from './KupacPanel';

function App() {
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Greška pri čitanju sačuvanog korisnika", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (user) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
          <h2>Eatery App</h2>
          <div>
            <span>Prijavljeni ste kao: <strong>{user.korisnickoIme}</strong> ({user.uloga}) </span>
            <button onClick={handleLogout} style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }}>Odjava</button>
          </div>
        </header>

        <main style={{ marginTop: '20px' }}>
          {user.uloga === 'KUPAC' && (
            <KupacPanel user={user} />
          )}

          {user.uloga === 'KLIJENT' && (
            <RestoranPanel user={user} />
          )}

          {user.uloga === 'ADMINISTRATOR' && (
            <AdminPanel />
          )}
        </main>
      </div>
    );
  }

  return (
    <div>
      {isRegistering ? (
        <RegisterKupac onSwitchToLogin={() => setIsRegistering(false)} />
      ) : (
        <div>
          <Login onLoginSuccess={(userData) => setUser(userData)} />
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <button onClick={() => setIsRegistering(true)} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}>
              Nemate nalog? Registrujte se kao Kupac
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;