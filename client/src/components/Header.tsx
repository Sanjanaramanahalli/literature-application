import React, { useState } from 'react';
import { BookOpen, Search, Bookmark, ShieldCheck, LogOut, Menu, X } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: any;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky-header" id="main-header">
      <div className="header-container">
        {/* Brand Logo */}
        <div className="brand" onClick={() => handleNav('home')} role="button" tabIndex={0}>
          <div className="brand-crest">
            <BookOpen size={22} className="brand-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-title">ATHENÆUM</span>
            <span className="brand-subtitle">CLASSIC LITERATURE</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <button
            className={`nav-link ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => handleNav('home')}
            id="nav-home"
          >
            Home
          </button>
          <button
            className={`nav-link ${currentTab === 'explore' ? 'active' : ''}`}
            onClick={() => handleNav('explore')}
            id="nav-explore"
          >
            Explore
          </button>
          <button
            className={`nav-link ${currentTab === 'categories' ? 'active' : ''}`}
            onClick={() => handleNav('categories')}
            id="nav-categories"
          >
            Categories
          </button>
          <button
            className={`nav-link ${currentTab === 'search' ? 'active' : ''}`}
            onClick={() => handleNav('search')}
            id="nav-search"
          >
            <Search size={15} style={{ marginRight: '4px' }} />
            Advanced Search
          </button>

          {user && (
            <button
              className={`nav-link ${currentTab === 'saved' ? 'active' : ''}`}
              onClick={() => handleNav('saved')}
              id="nav-saved"
            >
              <Bookmark size={15} style={{ marginRight: '4px' }} />
              Saved Works
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button
              className={`nav-link admin-nav-link ${currentTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleNav('admin')}
              id="nav-admin"
            >
              <ShieldCheck size={16} style={{ marginRight: '4px' }} />
              Admin Dashboard
            </button>
          )}
        </nav>

        {/* User / Authentication Actions */}
        <div className="header-actions">
          {user ? (
            <div className="user-profile-badge">
              <span className="user-role-tag">{user.role}</span>
              <span className="user-name">{user.name}</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onLogout}
                title="Sign Out"
                id="btn-logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenAuth('login')}
                id="btn-open-login"
              >
                Sign In
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onOpenAuth('register')}
                id="btn-open-register"
              >
                Create Account
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer" id="mobile-menu">
          <button className="mobile-nav-link" onClick={() => handleNav('home')}>
            Home
          </button>
          <button className="mobile-nav-link" onClick={() => handleNav('explore')}>
            Explore Literature
          </button>
          <button className="mobile-nav-link" onClick={() => handleNav('categories')}>
            Categories
          </button>
          <button className="mobile-nav-link" onClick={() => handleNav('search')}>
            Advanced Search
          </button>
          {user && (
            <button className="mobile-nav-link" onClick={() => handleNav('saved')}>
              Saved Works
            </button>
          )}
          {user?.role === 'ADMIN' && (
            <button className="mobile-nav-link admin-nav-link" onClick={() => handleNav('admin')}>
              Admin Dashboard
            </button>
          )}
        </div>
      )}
    </header>
  );
};
