import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Search, Bookmark, ShieldCheck, LogOut, Menu, X, Palette, Bell, Heart, MessageSquare, UserPlus } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'NEW_USER' | 'SAVE';
  title: string;
  message: string;
  actor: string;
  createdAt: string;
}

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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('literature_token');
      if (!token) return;
      const res = await fetch('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Ignore background notification fetch errors
    }
  };

  const handleNav = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    setShowNotifications(false);
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
            className={`nav-link ${currentTab === 'categories' ? 'active' : ''}`}
            onClick={() => handleNav('categories')}
            id="nav-categories"
          >
            Categories
          </button>
          <button
            className={`nav-link ${currentTab === 'artcraft' ? 'active' : ''}`}
            onClick={() => handleNav('artcraft')}
            id="nav-artcraft"
          >
            <Palette size={15} style={{ marginRight: '4px' }} />
            Art & Craft
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

          {user?.role === 'ADMIN' ? (
            <button
              className={`nav-link admin-nav-link ${currentTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleNav('admin')}
              id="nav-admin"
            >
              <ShieldCheck size={16} style={{ marginRight: '4px' }} />
              Admin Dashboard
            </button>
          ) : (
            <button
              className={`nav-link admin-nav-link ${currentTab === 'admin-signin' ? 'active' : ''}`}
              onClick={() => handleNav('admin-signin')}
              id="nav-admin-signin"
              title="Dedicated Curator / Administrator Sign-In"
            >
              <ShieldCheck size={15} style={{ marginRight: '4px' }} />
              Admin Sign-In
            </button>
          )}
        </nav>

        {/* User / Authentication Actions */}
        <div className="header-actions">
          {user?.role === 'ADMIN' && (
            <div className="admin-notifications-container" ref={notifRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn-header-notif"
                onClick={() => setShowNotifications(!showNotifications)}
                id="btn-admin-notifications"
                title="Admin Notifications (Likes, Comments, New Users)"
                style={{
                  position: 'relative',
                  background: showNotifications ? 'var(--bg-secondary)' : 'transparent',
                  border: '1px solid var(--border-classic)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-burgundy)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span
                    id="notif-badge-count"
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'var(--accent-burgundy)',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      borderRadius: '9999px',
                      padding: '0 4px',
                      minWidth: '15px',
                      height: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Popover */}
              {showNotifications && (
                <div
                  className="admin-notifications-dropdown"
                  id="admin-notifications-dropdown"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '320px',
                    maxHeight: '400px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-classic)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 32px rgba(44, 24, 16, 0.18)',
                    zIndex: 1000,
                    overflowY: 'auto',
                    padding: '0.75rem 0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem 1rem 0.65rem',
                      borderBottom: '1px solid var(--border-classic)',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-burgundy)' }}>
                      Curator Activity & Alerts
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {notifications.length} recent
                    </span>
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No recent alerts or user activities.
                    </div>
                  ) : (
                    <div className="notif-list" style={{ display: 'flex', flexDirection: 'column' }}>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid rgba(0,0,0,0.05)',
                            display: 'flex',
                            gap: '0.65rem',
                            alignItems: 'flex-start',
                            fontSize: '0.83rem',
                            transition: 'background-color 0.2s',
                          }}
                        >
                          <div style={{ marginTop: '2px', color: 'var(--accent-gold)' }}>
                            {n.type === 'LIKE' && <Heart size={15} color="#e74c3c" fill="#e74c3c" />}
                            {n.type === 'COMMENT' && <MessageSquare size={15} color="#2980b9" />}
                            {n.type === 'NEW_USER' && <UserPlus size={15} color="#27ae60" />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                              {n.title}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                              {n.message}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="user-profile-badge" id="header-user-profile">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="user-avatar-img"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="user-avatar-fallback">
                  {user.name ? user.name[0].toUpperCase() : 'S'}
                </div>
              )}
              <span className="user-name" title={user.name}>{user.name}</span>
              <span className="user-role-tag">{user.role}</span>
              <button
                className="btn-header-logout"
                onClick={onLogout}
                title="Sign Out"
                id="btn-logout"
                aria-label="Sign Out"
              >
                <LogOut size={13} />
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
          <button className="mobile-nav-link" onClick={() => handleNav('categories')}>
            Categories
          </button>
          <button className="mobile-nav-link" onClick={() => handleNav('artcraft')} id="mobile-nav-artcraft">
            Art & Craft
          </button>
          <button className="mobile-nav-link" onClick={() => handleNav('search')}>
            Advanced Search
          </button>
          {user && (
            <button className="mobile-nav-link" onClick={() => handleNav('saved')}>
              Saved Works
            </button>
          )}
          {user?.role === 'ADMIN' ? (
            <>
              <button
                className="mobile-nav-link"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowNotifications(true);
                }}
                id="mobile-nav-notifications"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>
                  <Bell size={15} style={{ marginRight: '6px', display: 'inline' }} />
                  Notifications & Alerts
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: 'var(--accent-burgundy)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: '10px',
                      padding: '1px 6px',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
              <button className="mobile-nav-link admin-nav-link" onClick={() => handleNav('admin')}>
                Admin Dashboard
              </button>
            </>
          ) : (
            <button className="mobile-nav-link admin-nav-link" onClick={() => handleNav('admin-signin')}>
              Admin Sign-In
            </button>
          )}

          {/* User Sign In / Sign Out in Mobile Menu */}
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-classic)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Signed in as <strong>{user.name}</strong> ({user.role})
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => { setMobileMenuOpen(false); onOpenAuth('login'); }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => { setMobileMenuOpen(false); onOpenAuth('register'); }}
                >
                  Inscribe
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
