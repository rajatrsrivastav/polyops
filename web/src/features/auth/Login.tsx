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
          packbay<span className="brand-period">.</span>
        </Link>
        <div>
          <p className="eyebrow">SMALL SHOP. BIG PLANS.</p>
          <h1>
            A little order.
            <br /> A lot more
            <br />
            <em>possibility.</em>
          </h1>
          <p>
            Your products, orders, and packing team.
            <br />
            One calm place to keep things moving.
          </p>
          <div className="parcel-art" aria-hidden="true">
            <div className="parcel">
              <span>MILLET & CO.</span>
              <i />
              <b>packed with care</b>
            </div>
            <div className="parcel-note">
              <Icon name="check" /> Ready for your next chapter
            </div>
          </div>
        </div>
        <p className="story-foot">Made for the people behind the parcels.</p>
      </section>
      <section className="login-form">
        <div className="login-card">
          <span className="label-pill">OWNER WORKSPACE</span>
          <h2>Welcome back.</h2>
          <p className="muted">Let’s make room for a good day.</p>
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
                placeholder="you@yourshop.com"
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
            Access is set up by your shop administrator.
            <br />
            Packing staff? Use the Packbay Staff app.
          </p>
          <Link className="privacy-link" to="/privacy">
            Privacy & your data
          </Link>
        </div>
        <p className="login-footer">A clear desk. A fresh start. Packbay.</p>
      </section>
    </main>
  );
}
