import React, { useState, useEffect } from 'react';
import Login from './auth/Login';
import RegisterKupac from './auth/RegistarKupac';
import RegisterKlijent from './auth/RegistarKlijent';
import AdminPanel from './admin/AdminPanel';
import RestoranPanel from './klijent/RestoranPanel';
import KupacPanel from './kupac/KupacPanel';
import 'leaflet/dist/leaflet.css';
import './styles/eatery-styles.css';

function App() {

  const [user, setUser] = useState(null);
  const [registerMode, setRegisterMode] = useState(null);

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
    localStorage.removeItem('token');
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

  if (registerMode === 'kupac') {

    return <RegisterKupac onSwitchToLogin={() => setRegisterMode(null)} />;
  }

  if (registerMode === 'klijent') {

    return <RegisterKlijent onSwitchToLogin={() => setRegisterMode(null)} />;
  }

  return (
    
    <Login
      onLoginSuccess={(userData) => setUser(userData)}
      onSwitchToRegister={() => setRegisterMode('kupac')}
      onSwitchToRegisterKlijent={() => setRegisterMode('klijent')}
    />
  );
}

export default App;
