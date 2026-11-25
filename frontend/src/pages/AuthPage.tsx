import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthHeroPanel from '../components/AuthHeroPanel';

type AuthMode = 'login' | 'signup';

export default function AuthPage(): React.ReactElement {
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const switchMode = (nextMode: AuthMode): void => {
    setMode(nextMode);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');

    if (mode === 'signup' && fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      setSubmitting(true);
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ fullName, email, password });
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <AuthHeroPanel />

      <main className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Sign up
            </button>
          </div>

          <h2 className="auth-heading">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="auth-subheading">
            {mode === 'login'
              ? 'Log in to pick up where you left off.'
              : 'Start capturing ideas in a private space of your own.'}
          </p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-fullname">
                  Full name
                </label>
                <input
                  id="auth-fullname"
                  className="form-input"
                  type="text"
                  placeholder="Alex Morgan"
                  value={fullName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                className="form-input"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary btn-full" disabled={submitting}>
              {submitting ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
            </button>
          </form>

          <div className="auth-switch-footer">
            {mode === 'login' ? (
              <>
                New here?
                <button type="button" onClick={() => switchMode('signup')}>
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?
                <button type="button" onClick={() => switchMode('login')}>
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
