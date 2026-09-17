import React, { useState } from 'react';
import { X, Lock, Mail, User, KeyRound, AlertCircle, CheckCircle, ArrowRight, ShieldCheck, RotateCw, Inbox, Copy, Eye, EyeOff } from 'lucide-react';

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

  // Password Visibility States (LIT-15 & LIT-16)
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  // Forgot password OTP flow fields
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'reset' | 'success'>('request');
  const [otp, setOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);


  // Email Inbox Drawer state
  const [inboxMessage, setInboxMessage] = useState<any | null>(null);
  const [showInbox, setShowInbox] = useState(false);
  const [inboxLoading, setInboxLoading] = useState(false);

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
    setForgotStep('request');
    setOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setResetToken(null);
    setInboxMessage(null);
    setShowInbox(false);
    setError(null);
    setMessage(null);
  };

  const fetchLatestEmail = async () => {
    if (!email) return;
    setInboxLoading(true);
    try {
      const res = await fetch(`/api/auth/inbox/${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setInboxMessage(data.messages[0]);
      } else {
        setInboxMessage(null);
      }
      setShowInbox(true);
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
    } finally {
      setInboxLoading(false);
    }
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
      const res = await fetch('/api/auth/login', {
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

    if (showAdminField && !adminSecret.trim()) {
      setError('Admin Secret Invitation Key is required to create an Admin account.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          role: showAdminField ? 'ADMIN' : 'READER',
          adminInvitationKey: showAdminField ? adminSecret.trim() : undefined,
          adminSecret: showAdminField ? adminSecret.trim() : undefined,
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
      const res = await fetch('/api/auth/google', {
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

  // 4a. Forgot Password: Step 1 - Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please provide a valid email format.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request OTP.');
      }

      setMessage(data.message);
      setForgotStep('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4b. Forgot Password: Step 2 - Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    if (trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
      setError('OTP must be exactly 6 numeric digits.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: trimmedOtp }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'OTP verification failed.');
      }

      setResetToken(data.resetToken);
      setMessage(data.message);
      setForgotStep('reset');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4c. Forgot Password: Step 3 - Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setError('New password must be at least 6 characters in length.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('New password and Confirm Password do not match.');
      return;
    }

    if (!resetToken) {
      setError('Verification token missing. Please request a new OTP.');
      setForgotStep('request');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: forgotNewPassword,
          confirmPassword: forgotConfirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Password update failed.');
      }

      setMessage(data.message);
      setForgotStep('success');
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
              {mode === 'forgot' && forgotStep === 'request' && 'Account Recovery'}
              {mode === 'forgot' && forgotStep === 'verify' && 'Verify OTP Code'}
              {mode === 'forgot' && forgotStep === 'reset' && 'Create New Password'}
              {mode === 'forgot' && forgotStep === 'success' && 'Recovery Complete'}
            </span>
            <span className="modal-subtitle">
              {mode === 'login' && 'Sign in to access your reading room, ratings, and reflections.'}
              {mode === 'register' && 'Become a registered reader of timeless literature.'}
              {mode === 'forgot' && forgotStep === 'request' && 'Enter your registered email to receive a 6-digit verification OTP.'}
              {mode === 'forgot' && forgotStep === 'verify' && `Enter the 6-digit OTP code dispatched to ${email}.`}
              {mode === 'forgot' && forgotStep === 'reset' && 'Please choose a new robust password for your reading account.'}
              {mode === 'forgot' && forgotStep === 'success' && 'Your password has been updated. You can now sign in.'}
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
              <div className="input-icon-wrapper password-toggle-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  id="login-password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  id="toggle-login-password"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  title={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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
                <div className="input-icon-wrapper password-toggle-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    id="reg-password"
                    className="input-field"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    id="toggle-reg-password"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    title={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group half">
                <label htmlFor="reg-confirm">Confirm Password</label>
                <div className="input-icon-wrapper password-toggle-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    id="reg-confirm"
                    className="input-field"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    id="toggle-reg-confirm"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
                {showAdminField ? '– Register as Normal Reader' : '+ Create Admin Account (Requires Invitation Key)'}
              </button>
            </div>

            {showAdminField && (
              <div className="form-group admin-field-group">
                <label htmlFor="reg-admin-secret">
                  Admin Secret Invitation Key <span style={{ color: 'var(--accent-burgundy)' }}>*</span>
                </label>
                <div className="input-icon-wrapper password-toggle-wrapper">
                  <KeyRound size={16} className="input-icon" />
                  <input
                    type={showAdminKey ? 'text' : 'password'}
                    id="reg-admin-secret"
                    className="input-field"
                    placeholder="Enter curatorial passkey"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    required={showAdminField}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    id="toggle-admin-key"
                    onClick={() => setShowAdminKey(!showAdminKey)}
                    aria-label={showAdminKey ? 'Hide key' : 'Show key'}
                    title={showAdminKey ? 'Hide key' : 'Show key'}
                  >
                    {showAdminKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Restricted to authorized curatorial administrators with a cryptographically verified invitation key.
                </span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              id="btn-submit-register"
            >
              {loading ? 'Inscribing Account...' : showAdminField ? 'Create Admin Account' : 'Create Reader Account'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}


        {/* --- FORGOT PASSWORD OTP MULTI-STEP FLOW --- */}
        {mode === 'forgot' && forgotStep === 'request' && (
          <form onSubmit={handleSendOtp} className="auth-form" id="form-forgot-request">
            <div className="form-group">
              <label htmlFor="forgot-email">Registered Reader Email Address</label>
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
              {loading ? 'Generating OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {mode === 'forgot' && forgotStep === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="auth-form" id="form-forgot-verify">
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="forgot-otp">Enter 6-Digit OTP</label>
                <span className="otp-email-label">{email}</span>
              </div>
              <div className="input-icon-wrapper">
                <ShieldCheck size={16} className="input-icon" />
                <input
                  type="text"
                  id="forgot-otp"
                  className="input-field otp-input"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || otp.length !== 6}
              id="btn-verify-otp"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="otp-resend-row">
              <span>Didn't receive the OTP?</span>
              <button
                type="button"
                className="link-btn btn-resend-otp"
                id="btn-resend-otp"
                onClick={() => handleSendOtp()}
                disabled={loading}
              >
                <RotateCw size={13} className={loading ? 'spin' : ''} />
                Resend OTP
              </button>
            </div>

            <div style={{
              marginTop: '1rem',
              padding: '0.85rem 1rem',
              background: 'var(--bg-parchment-subtle, rgba(243, 238, 230, 0.6))',
              border: '1px solid var(--border-parchment, #E5DFD5)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: 'var(--text-muted, #736B63)',
              lineHeight: 1.5,
              textAlign: 'center'
            }}>
              📧 A 6-digit OTP has been delivered to your registered email address. Please check your inbox (and spam folder if not found in primary).
            </div>

            {/* Development-only Simulated Mailbox Link (Hidden in Production) */}
            {import.meta.env.DEV && (
              <div className="inbox-launcher-card" style={{ marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-block btn-inbox"
                  id="btn-open-inbox"
                  onClick={fetchLatestEmail}
                  disabled={inboxLoading}
                >
                  <Inbox size={15} />
                  {inboxLoading ? 'Checking Local Mailbox...' : 'Local Dev Mailbox (Dev Mode Only)'}
                </button>
              </div>
            )}

            {/* Simulated Mailbox Drawer/Card in DEV */}
            {import.meta.env.DEV && showInbox && inboxMessage && (
              <div className="mailbox-card" id="mailbox-preview">
                <div className="mailbox-header">
                  <span className="mailbox-subject">{inboxMessage.subject}</span>
                  <span className="mailbox-time">{new Date(inboxMessage.sentAt).toLocaleTimeString()}</span>
                </div>
                <div className="mailbox-meta">
                  <span><strong>From:</strong> {inboxMessage.from}</span>
                  <span><strong>To:</strong> {inboxMessage.to}</span>
                </div>
                <div className="mailbox-body">
                  <pre>{inboxMessage.body}</pre>
                </div>
                <div className="mailbox-actions-row">
                  <span className="mailbox-privacy-notice">🔒 Delivered to registered email address</span>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm btn-autofill-otp"
                    id="btn-autofill-otp"
                    onClick={() => setOtp(inboxMessage.otp)}
                  >
                    <Copy size={13} />
                    Insert OTP: {inboxMessage.otp}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {mode === 'forgot' && forgotStep === 'reset' && (
          <form onSubmit={handleResetPassword} className="auth-form" id="form-forgot-reset">
            <div className="form-group">
              <label htmlFor="forgot-new-password">New Password (min 6 characters)</label>
              <div className="input-icon-wrapper password-toggle-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  id="forgot-new-password"
                  className="input-field"
                  placeholder="••••••••"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  id="toggle-forgot-password"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                  title={showResetPassword ? 'Hide password' : 'Show password'}
                >
                  {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="forgot-confirm-password">Confirm New Password</label>
              <div className="input-icon-wrapper password-toggle-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type={showResetConfirmPassword ? 'text' : 'password'}
                  id="forgot-confirm-password"
                  className="input-field"
                  placeholder="••••••••"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  id="toggle-forgot-confirm-password"
                  onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                  aria-label={showResetConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showResetConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showResetConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              id="btn-reset-password"
            >
              {loading ? 'Updating Password...' : 'Set New Password'}
            </button>
          </form>
        )}

        {mode === 'forgot' && forgotStep === 'success' && (
          <div className="auth-success-screen" id="forgot-success-screen">
            <div className="success-icon-wrapper">
              <CheckCircle size={48} className="text-success" />
            </div>
            <p className="success-message">
              Your password has been successfully restored and secured. You may now proceed to enter the reading room with your new credentials.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              id="btn-back-to-login"
              onClick={() => switchMode('login')}
            >
              Proceed to Sign In
            </button>
          </div>
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
