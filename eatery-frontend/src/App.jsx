import React, { useState, useEffect } from 'react';
import Login from './auth/Login';
import RegisterKupac from './auth/RegistarKupac';
import AdminPanel from './admin/AdminPanel';
import RestoranPanel from './klijent/RestoranPanel';
import KupacPanel from './kupac/KupacPanel';
import 'leaflet/dist/leaflet.css';

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
    if (user.uloga === 'KUPAC') {
      return <KupacPanel user={user} onLogout={handleLogout} onUserUpdate={setUser} />;
    }

    if (user.uloga === 'KLIJENT') {
      return <RestoranPanel user={user} onLogout={handleLogout} />;
    }

    if (user.uloga === 'ADMINISTRATOR') {
      return <AdminPanel user={user} onLogout={handleLogout} />;
    }
  }

  return isRegistering ? (
    <RegisterKupac onSwitchToLogin={() => setIsRegistering(false)} />
  ) : (
    <Login
      onLoginSuccess={(userData) => setUser(userData)}
      onSwitchToRegister={() => setIsRegistering(true)}
    />
  );
}

export default App;
