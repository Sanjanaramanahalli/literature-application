import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Search, Bookmark, ShieldCheck, LogOut, Menu, X, Palette, Globe, Bell, Heart, MessageSquare, UserPlus } from 'lucide-react';

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
            className={`nav-link ${currentTab === 'world-literature' ? 'active' : ''}`}
            onClick={() => handleNav('world-literature')}
            id="nav-world-literature"
            title="Discover classical literature across supported Indian languages"
          >
            <Globe size={15} style={{ marginRight: '4px' }} />
            Indian Literature
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
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--accent-burgundy)',
                }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span
                    id="notif-badge-count"
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: 'var(--accent-burgundy)',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: '10px',
                      padding: '1px 5px',
                      minWidth: '16px',
                      textAlign: 'center',
                      lineHeight: '14px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
            <div className="user-profile-badge">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="user-avatar-img"
                  referrerPolicy="no-referrer"
                />
              ) : null}
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
          <button className="mobile-nav-link" onClick={() => handleNav('world-literature')} id="mobile-nav-world-literature">
            <Globe size={15} style={{ marginRight: '6px', display: 'inline' }} />
            Indian Literature
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
        </div>
      )}
    </header>
  );
};
