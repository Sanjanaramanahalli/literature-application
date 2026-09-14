import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import './components/Header.css';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check saved session
    const savedUser = localStorage.getItem('literature_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('literature_user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('literature_token');
    localStorage.removeItem('literature_user');
    setUser(null);
  };

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onOpenAuth={(mode) => console.log('Open auth:', mode)}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, padding: '3rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--accent-burgundy)' }}>
            Welcome to the Athenæum
          </h1>
          <p style={{ maxWidth: '650px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            A dedicated sanctuary for discovering, reading, and contemplating timeless works of world literature.
          </p>
        </div>
      </main>

      <footer style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-classic)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          © 2026 Athenæum Classic Literature Repository. Dedicated to humanistic arts and timeless scholarship.
        </p>
      </footer>
    </div>
  );
};

export default App;
