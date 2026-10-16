import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, LogIn, BookOpen } from 'lucide-react';
import './AdminSignInPage.css';

interface AdminSignInPageProps {
  onSuccess: (user: any, token: string) => void;
  onNavigateHome: () => void;
  onOpenForgotPassword?: () => void;
}

export const AdminSignInPage: React.FC<AdminSignInPageProps> = ({
  onSuccess,
  onNavigateHome,
  onOpenForgotPassword,
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
    <div
      className="admin-signin-container"
      id="admin-signin-page"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 220px)',
        padding: '2.5rem 1.25rem',
        backgroundColor: '#FDFBF7',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        #admin-signin-page input.form-input {
          width: 100% !important;
          padding: 0.75rem 1rem 0.75rem 2.65rem !important;
          font-family: inherit !important;
          font-size: 0.94rem !important;
          color: #2C1D11 !important;
          background-color: #FFFFFF !important;
          border: 1px solid #E3DAC9 !important;
          border-radius: 6px !important;
          box-sizing: border-box !important;
          height: 44px !important;
          outline: none !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        #admin-signin-page input.form-input:focus {
          border-color: #722F37 !important;
          box-shadow: 0 0 0 3px rgba(114, 47, 55, 0.12) !important;
        }
        #admin-signin-page input.form-input.password-input {
          padding-right: 2.75rem !important;
        }
      `}</style>

      <div
        className="admin-signin-card"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E3DAC9',
          borderRadius: '12px',
          boxShadow: '0 16px 44px rgba(44, 29, 17, 0.1)',
          width: '100%',
          maxWidth: '480px',
          padding: '2.5rem 2.5rem 2.25rem',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" htmlFor="admin-password" style={{ marginBottom: 0 }}>
                Administrator Password
              </label>
              {onOpenForgotPassword && (
                <button
                  type="button"
                  onClick={onOpenForgotPassword}
                  id="btn-admin-forgot-password"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--accent-gold, #c5a059)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input password-input"
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
            style={{
              width: '100%',
              padding: '0.85rem 1.25rem',
              fontFamily: "var(--font-ui, 'Inter', sans-serif)",
              fontSize: '0.98rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              marginTop: '0.5rem',
              backgroundColor: '#722F37',
              color: '#FFFFFF',
              border: '1px solid #722F37',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(114, 47, 55, 0.22)',
              minHeight: '48px',
              boxSizing: 'border-box',
              letterSpacing: '0.01em',
            }}
          >
            <LogIn size={16} />
            <span>{loading ? 'Authenticating Archival Session...' : 'Sign In to Curator Studio'}</span>
          </button>

          {onOpenForgotPassword && (
            <div className="admin-reset-container">
              <span>Need to set or reset your password?</span>
              <button
                type="button"
                onClick={onOpenForgotPassword}
                id="btn-admin-reset-link"
                className="admin-reset-link"
              >
                Reset via OTP
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
