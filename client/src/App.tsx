import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { CatalogView } from './components/CatalogView';
import { SearchView } from './components/SearchView';
import { ReaderView } from './components/ReaderView';
import './components/Header.css';
import './components/AuthModal.css';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedLiteratureId, setSelectedLiteratureId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser: any, _token: string) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('literature_token');
    localStorage.removeItem('literature_user');
    setUser(null);
  };

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSelectedLiteratureId(null);
          setCurrentTab(tab);
        }}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />
      <main style={{ flex: 1, padding: '2.5rem 1.5rem', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        {/* Welcome Sanctuary Hero Banner */}
        <div style={{ textAlign: 'center', padding: '2rem 1rem 1.5rem', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--accent-burgundy)' }} id="sanctuary-welcome-heading">
            Welcome to the Athenæum
          </h1>
          <p style={{ maxWidth: '680px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
            A dedicated sanctuary for discovering, reading, and contemplating timeless works of world literature.
          </p>
        </div>

        {/* Active user greeting pill */}
        {user && (
          <div
            style={{
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-classic)',
              borderRadius: 'var(--radius-md)',
            }}
            id="active-user-banner"
          >
            <div>
              <p style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                Scholar Session: {user.name} ({user.role})
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{user.email}</p>
            </div>
            <span className="tag-badge burgundy">Authenticated</span>
          </div>
        )}

        {/* Dynamic View rendering based on selected literature or currentTab */}
        {selectedLiteratureId ? (
          <ReaderView
            literatureId={selectedLiteratureId}
            user={user}
            onBack={() => setSelectedLiteratureId(null)}
            onOpenAuth={handleOpenAuth}
          />
        ) : (
          <>
            {(currentTab === 'home' || currentTab === 'explore' || currentTab === 'categories') && (
              <CatalogView
                currentTab={currentTab}
                onSelectLiterature={(item) => {
                  setSelectedLiteratureId(item.id);
                }}
              />
            )}

            {currentTab === 'search' && (
              <SearchView
                onSelectLiterature={(item) => {
                  setSelectedLiteratureId(item.id);
                }}
              />
            )}
          </>
        )}

        {currentTab === 'saved' && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <h2 className="serif-title" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--accent-burgundy)' }}>
              Personal Reading Sanctuary
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Sign in as a reader to view your saved personal manuscripts and reading list.
            </p>
          </div>
        )}

        {currentTab === 'admin' && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <h2 className="serif-title" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--accent-burgundy)' }}>
              Archival Curation & Administration
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Administrative dashboard with live KPI analytics and publication control.
            </p>
          </div>
        )}
      </main>

      <footer style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-classic)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          © 2026 Athenæum Classic Literature Repository. Dedicated to humanistic arts and timeless scholarship.
        </p>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default App;
