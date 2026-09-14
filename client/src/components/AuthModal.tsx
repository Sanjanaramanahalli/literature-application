import React, { useState } from 'react';
import { X, Lock, Mail, User, KeyRound, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: any, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  React.useEffect(() => {
    setMode(initialMode);
    setError(null);
    setMessage(null);
  }, [initialMode, isOpen]);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [showAdminField, setShowAdminField] = useState(false);

  // States
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAdminSecret('');
    setError(null);
    setMessage(null);
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    resetForm();
    setMode(newMode);
  };

  // 1. Submit Email/Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in.');
      }

      localStorage.setItem('literature_token', data.token);
      localStorage.setItem('literature_user', JSON.stringify(data.user));
      onSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Reader / Admin Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          adminSecret: adminSecret || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account.');
      }

      localStorage.setItem('literature_token', data.token);
      localStorage.setItem('literature_user', JSON.stringify(data.user));
      onSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Dual-Mode Google OAuth (Interactive Simulation Fallback)
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demoUser: {
            name: 'Scholar Reader',
            email: 'scholar.reader@gmail.com',
          },
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Google sign in failed.');
      }

      localStorage.setItem('literature_token', data.token);
      localStorage.setItem('literature_user', JSON.stringify(data.user));
      onSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Forgot Password Dispatch
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request reset.');
      }

      setMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" id="auth-modal-overlay" onClick={onClose}>
      <div
        className="modal-plate auth-modal-container"
        id="auth-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="serif-title modal-title">
              {mode === 'login' && 'Enter the Sanctuary'}
              {mode === 'register' && 'Join the Athenæum'}
              {mode === 'forgot' && 'Account Recovery'}
            </span>
            <span className="modal-subtitle">
              {mode === 'login' && 'Sign in to access your reading room, ratings, and reflections.'}
              {mode === 'register' && 'Become a registered reader of timeless literature.'}
              {mode === 'forgot' && 'Enter your email to receive password restoration dispatch.'}
            </span>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="auth-alert error" id="auth-error-msg">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="auth-alert success" id="auth-success-msg">
            <CheckCircle size={16} />
            <span>{message}</span>
          </div>
        )}

        {/* --- LOGIN FORM --- */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-form" id="form-login">
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-icon-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  id="login-email"
                  className="input-field"
                  placeholder="scholar@literature.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="login-password">Password</label>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => switchMode('forgot')}
                  id="btn-switch-forgot"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="input-icon-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type="password"
                  id="login-password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              id="btn-submit-login"
            >
              {loading ? 'Consulting Records...' : 'Sign In to Read'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* --- REGISTER FORM --- */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="auth-form" id="form-register">
            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <div className="input-icon-wrapper">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  id="reg-name"
                  className="input-field"
                  placeholder="Julian Croft"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <div className="input-icon-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  id="reg-email"
                  className="input-field"
                  placeholder="julian@literature.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="reg-password">Password</label>
                <div className="input-icon-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    type="password"
                    id="reg-password"
                    className="input-field"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="form-group half">
                <label htmlFor="reg-confirm">Confirm Password</label>
                <div className="input-icon-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    type="password"
                    id="reg-confirm"
                    className="input-field"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Optional Admin Invitation Secret Toggle */}
            <div className="admin-secret-toggle">
              <button
                type="button"
                className="link-btn text-sm"
                onClick={() => setShowAdminField(!showAdminField)}
                id="toggle-admin-secret"
              >
                {showAdminField ? '– Hide Curatorial Access Key' : '+ Have an Admin Invitation Key?'}
              </button>
            </div>

            {showAdminField && (
              <div className="form-group admin-field-group">
                <label htmlFor="reg-admin-secret">Admin Secret Invitation Key</label>
                <div className="input-icon-wrapper">
                  <KeyRound size={16} className="input-icon" />
                  <input
                    type="password"
                    id="reg-admin-secret"
                    className="input-field"
                    placeholder="Enter curatorial passkey"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              id="btn-submit-register"
            >
              {loading ? 'Inscribing Account...' : 'Create Reader Account'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* --- FORGOT PASSWORD FORM --- */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="auth-form" id="form-forgot">
            <div className="form-group">
              <label htmlFor="forgot-email">Registered Email Address</label>
              <div className="input-icon-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  id="forgot-email"
                  className="input-field"
                  placeholder="your.email@literature.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              id="btn-submit-forgot"
            >
              {loading ? 'Dispatching...' : 'Send Recovery Dispatch'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with scholarship</span>
        </div>

        {/* Google Dual-Mode OAuth Button */}
        <button
          type="button"
          className="btn btn-google btn-block"
          onClick={handleGoogleSignIn}
          disabled={loading}
          id="btn-google-auth"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z"
              fill="#4285F4"
            />
            <path
              d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
              fill="#34A853"
            />
            <path
              d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Footer Switching */}
        <div className="modal-footer-switch">
          {mode === 'login' ? (
            <p>
              New to the library?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => switchMode('register')}
                id="btn-switch-register"
              >
                Inscribe Account
              </button>
            </p>
          ) : (
            <p>
              Already have an inscribed account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => switchMode('login')}
                id="btn-switch-login"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
