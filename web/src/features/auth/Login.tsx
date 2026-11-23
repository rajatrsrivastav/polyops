import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { signIn, authConfigured } from '../../lib/session';
import { Icon } from '../../components/ui';
export function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const configured = authConfigured;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || busy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await signIn(String(values.get('email')), String(values.get('password')));
    } catch {
      setError('Sign-in failed. Check your email and password, then retry.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login">
      <section className="login-story">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Icon name="box" size={28} />
          </span>
          PolyOps<span className="brand-period">.</span>
        </Link>
        <div>
          <p className="eyebrow">FACTORY OPERATIONS</p>
          <h1>
            Orders, stock
            <br /> and <em>dispatch.</em>
          </h1>
          <p>
            Track buyer orders, check available stock and prepare shipments.
          </p>
          <div className="parcel-art" aria-hidden="true">
            <div className="parcel">
              <span>POLYOPS DEMO WORKS</span>
              <i />
              <b>Dispatch label</b>
            </div>
            <div className="parcel-note">
              <Icon name="check" /> Ready for dispatch
            </div>
          </div>
        </div>
      </section>
      <section className="login-form">
        <div className="login-card">
          <span className="label-pill">OWNER WORKSPACE</span>
          <h2>Welcome back.</h2>
          <p className="muted">Sign in to the factory dashboard.</p>
          {!configured && (
            <div className="setup-note" role="status">
              <strong>Your workspace needs connecting.</strong>
              <p>Configure the API address using the setup guide before signing in.</p>
            </div>
          )}
          <form onSubmit={submit}>
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                required
                disabled={!configured}
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                required
                minLength={6}
                disabled={!configured}
              />
            </label>
            {error && (
              <p className="notice" role="alert">
                {error}
              </p>
            )}
            <button className="button primary full" disabled={busy || !configured}>
              {busy ? 'Signing in…' : 'Open my workspace'}
            </button>
          </form>
          <p className="login-help">
            Access is set up by your factory administrator.
            <br />
            Factory staff can sign in on the PolyOps mobile app.
          </p>
          <Link className="privacy-link" to="/privacy">
            Privacy & your data
          </Link>
        </div>
      </section>
    </main>
  );
}
