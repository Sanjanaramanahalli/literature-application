import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, LogIn, BookOpen } from 'lucide-react';
import './AdminSignInPage.css';

interface AdminSignInPageProps {
  onSuccess: (user: any, token: string) => void;
  onNavigateHome: () => void;
}

export const AdminSignInPage: React.FC<AdminSignInPageProps> = ({
  onSuccess,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Both email and password are required for Administrator sign-in.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate Administrator.');
      }

      localStorage.setItem('literature_token', data.token);
      localStorage.setItem('literature_user', JSON.stringify(data.user));
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify administrative credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-signin-container" id="admin-signin-page">
      <div className="admin-signin-card">
        {/* Back Link */}
        <button
          type="button"
          className="admin-signin-back"
          onClick={onNavigateHome}
          id="btn-admin-signin-back"
        >
          <ArrowLeft size={16} />
          <span>Return to Athenæum Sanctuary</span>
        </button>

        {/* Security Shield Header */}
        <div className="admin-signin-header">
          <div className="admin-signin-crest">
            <ShieldCheck size={36} className="admin-crest-icon" />
          </div>
          <span className="admin-signin-badge">Curatorial Editorial Portal</span>
          <h1 className="serif-title admin-signin-title" id="admin-signin-title">
            Administrator Sign-In
          </h1>
          <p className="admin-signin-subtitle">
            Restricted access for Athenæum archivist curators, editors, and scholars.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="admin-signin-error" id="admin-signin-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="admin-signin-form" id="admin-signin-form">
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">
              Curator Email Address
            </label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="admin-email"
                type="email"
                className="form-input"
                placeholder="curator@literature.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">
              Administrator Password
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                id="btn-toggle-admin-password"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="admin-signin-meta-info">
            <BookOpen size={14} style={{ color: 'var(--accent-gold)' }} />
            <span>Curatorial editorial privileges are cryptographically validated by role.</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary admin-submit-btn"
            disabled={loading}
            id="btn-submit-admin-signin"
          >
            <LogIn size={16} />
            <span>{loading ? 'Authenticating Archival Session...' : 'Sign In to Curator Studio'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
