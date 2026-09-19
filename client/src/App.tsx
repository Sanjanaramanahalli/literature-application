import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { CatalogView } from './components/CatalogView';
import { SearchView } from './components/SearchView';
import { ReaderView } from './components/ReaderView';
import { SavedWorksView } from './components/SavedWorksView';
import { AdminEditorialView } from './components/AdminEditorialView';
import { AdminSignInPage } from './components/AdminSignInPage';
import { ArtCraftCatalogView } from './components/ArtCraftCatalogView';
import { ArtCraftDetailView } from './components/ArtCraftDetailView';
import type { ArtCraftItem } from './components/ArtCraftCard';
import { ExternalLiteratureReader } from './components/ExternalLiteratureReader';
import type { ExternalWorkDetail } from './components/ExternalLiteratureReader';
import './components/Header.css';
import './components/AuthModal.css';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedLiteratureId, setSelectedLiteratureId] = useState<string | null>(null);
  const [selectedArtCraft, setSelectedArtCraft] = useState<ArtCraftItem | null>(null);
  const [selectedExternalWork, setSelectedExternalWork] = useState<ExternalWorkDetail | null>(null);
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
    // Always return to home tab on logout — prevents user being stranded on
    // the Admin restricted guard screen if they were on the 'admin' tab.
    setCurrentTab('home');
    setSelectedLiteratureId(null);
    setSelectedArtCraft(null);
    setSelectedExternalWork(null);
  };

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSelectedLiteratureId(null);
          setSelectedArtCraft(null);
          setSelectedExternalWork(null);
          setCurrentTab(tab);
        }}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />
      <main className="app-main-content" style={{ flex: 1, padding: '2.5rem 1.5rem', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        {/* Welcome Sanctuary Hero Banner (Show for home, categories) */}
        {(currentTab === 'home' || currentTab === 'categories') && !selectedLiteratureId && !selectedExternalWork && (
          <div className="app-welcome-banner" style={{ textAlign: 'center', padding: '2rem 1rem 1.5rem', marginBottom: '1.5rem' }}>
            <h1 className="app-welcome-heading" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--accent-burgundy)' }} id="sanctuary-welcome-heading">
              Welcome to the Athenæum
            </h1>
            <p className="app-welcome-subtitle" style={{ maxWidth: '680px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
              A dedicated sanctuary for discovering, reading, and contemplating timeless works of world literature.
            </p>
          </div>
        )}

        {/* Active user greeting pill */}
        {user && currentTab !== 'admin-signin' && !selectedLiteratureId && !selectedArtCraft && !selectedExternalWork && (
          <div
            className="active-user-banner"
            style={{
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              padding: '0.85rem 1.25rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-classic)',
              borderRadius: 'var(--radius-md)',
            }}
            id="active-user-banner"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)' }}
                  referrerPolicy="no-referrer"
                />
              )}
              <div>
                <p style={{ fontWeight: 600, color: 'var(--accent-burgundy)' }}>
                  Scholar Session: {user.name} ({user.role})
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{user.email}</p>
              </div>
            </div>
            <span className="tag-badge burgundy">Authenticated</span>
          </div>
        )}

        {/* Dynamic View rendering based on selected literature, selected external work, selected art craft, or currentTab */}
        {selectedLiteratureId ? (
          <ReaderView
            literatureId={selectedLiteratureId}
            user={user}
            onBack={() => setSelectedLiteratureId(null)}
            onOpenAuth={handleOpenAuth}
          />
        ) : selectedExternalWork ? (
          <ExternalLiteratureReader
            work={selectedExternalWork}
            onBack={() => setSelectedExternalWork(null)}
          />
        ) : selectedArtCraft ? (
          <ArtCraftDetailView
            craft={selectedArtCraft}
            onBack={() => setSelectedArtCraft(null)}
          />
        ) : (
          <>
            {(currentTab === 'home' || currentTab === 'categories') && (
              <CatalogView
                currentTab={currentTab}
                user={user}
                onOpenAuth={handleOpenAuth}
                onSelectLiterature={(item) => {
                  setSelectedLiteratureId(item.id);
                }}
                onSelectArtCraft={(craft) => {
                  setSelectedArtCraft(craft);
                }}
                onNavigateWorldLiterature={() => {
                  setCurrentTab('world-literature');
                }}
              />
            )}

            {currentTab === 'artcraft' && (
              <ArtCraftCatalogView
                onSelectArtCraft={(craft) => {
                  setSelectedArtCraft(craft);
                }}
              />
            )}

            {currentTab === 'world-literature' && (
              <SearchView
                key="world-literature-view"
                initialMode="external"
                user={user}
                onOpenAuth={handleOpenAuth}
                onSelectLiterature={(item) => {
                  setSelectedLiteratureId(item.id);
                }}
                onSelectArtCraft={(craft) => {
                  setSelectedArtCraft(craft);
                }}
                onSelectExternalWork={(work) => {
                  setSelectedExternalWork(work);
                }}
              />
            )}

            {currentTab === 'search' && (
              <SearchView
                key="classic-search-view"
                user={user}
                onOpenAuth={handleOpenAuth}
                onSelectLiterature={(item) => {
                  setSelectedLiteratureId(item.id);
                }}
                onSelectArtCraft={(craft) => {
                  setSelectedArtCraft(craft);
                }}
                onSelectExternalWork={(work) => {
                  setSelectedExternalWork(work);
                }}
              />
            )}
          </>
        )}

        {currentTab === 'saved' && (
          <SavedWorksView
            key={currentTab}
            user={user}
            onSelectLiterature={(id) => setSelectedLiteratureId(id)}
            onNavigateExplore={() => setCurrentTab('home')}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === 'admin' && (
          <AdminEditorialView
            user={user}
            onOpenAuth={handleOpenAuth}
            onNavigateAdminSignIn={() => setCurrentTab('admin-signin')}
            onViewLiterature={(id) => {
              setSelectedLiteratureId(id);
            }}
          />
        )}

        {currentTab === 'admin-signin' && (
          <AdminSignInPage
            onSuccess={(authenticatedAdmin) => {
              setUser(authenticatedAdmin);
              setCurrentTab('admin');
            }}
            onNavigateHome={() => setCurrentTab('home')}
          />
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
