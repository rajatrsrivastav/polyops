import { lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useSession } from './lib/session';
import { auth } from './lib/firebase';
import { api } from './lib/api';
import type { Me } from './lib/types';
import { Icon, State } from './components/ui';
import { Login } from './features/auth/Login';
const Dashboard = lazy(() =>
  import('./features/dashboard/Dashboard').then((module) => ({ default: module.Dashboard })),
);
const Products = lazy(() =>
  import('./features/products/Products').then((module) => ({ default: module.Products })),
);
const Orders = lazy(() =>
  import('./features/orders/Orders').then((module) => ({ default: module.Orders })),
);
const Inventory = lazy(() =>
  import('./features/inventory/Inventory').then((module) => ({ default: module.Inventory })),
);
const WeeklyBrief = lazy(() =>
  import('./features/brief/WeeklyBrief').then((module) => ({ default: module.WeeklyBrief })),
);
import privacy from '../../docs/privacy.md?raw';
function Privacy() {
  return (
    <main className="privacy-page">
      <Link className="text-link" to="/">
        Back to Packbay
      </Link>
      <article>
        {privacy
          .split('\n\n')
          .map((block, index) =>
            block.startsWith('# ') ? (
              <h1 key={index}>{block.slice(2)}</h1>
            ) : block.startsWith('## ') ? (
              <h2 key={index}>{block.slice(3)}</h2>
            ) : (
              <p key={index}>{block}</p>
            ),
          )}
      </article>
    </main>
  );
}
function Workspace() {
  const session = useSession();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/me'),
    enabled: Boolean(session.user),
  });
  if (session.loading) return <State loading>Loading</State>;
  if (!session.user) return <Login />;
  if (me.isPending || me.error)
    return (
      <main className="access-state">
        <State loading={me.isPending} error={me.error}>
          Loading
        </State>
        <button
          className="button secondary"
          onClick={() => {
            if (auth) void signOut(auth);
          }}
        >
          Sign out
        </button>
      </main>
    );
  if (me.data.role !== 'owner')
    return (
      <main className="access-state">
        <h1>Your packing desk is on mobile.</h1>
        <p>Use the Packbay Staff app to pick, pack, ship, and receive stock.</p>
        <button
          className="button primary"
          onClick={() => {
            if (auth) void signOut(auth);
          }}
        >
          Sign out
        </button>
      </main>
    );
  const nav = [
    { to: '/', title: 'Overview', icon: 'grid' },
    { to: '/orders', title: 'Orders', icon: 'orders' },
    { to: '/products', title: 'Products', icon: 'box' },
    { to: '/inventory', title: 'Inventory', icon: 'stock' },
    { to: '/brief', title: 'Weekly brief', icon: 'spark' },
  ];
  return (
    <div className="workspace">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Icon name="box" size={25} />
          </span>
          packbay<span className="brand-period">.</span>
        </Link>
        <div className="shop-label">
          <span className="shop-avatar">P</span>
          <div>
            <strong>{me.data.shopName}</strong>
            <small>Owner workspace</small>
          </div>
        </div>
        <p className="nav-label">YOUR WORKSPACE</p>
        <nav>
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              <Icon name={item.icon} />
              {item.title}
              {item.to === '/brief' && <span className="mini-label">AI</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Icon name="box" />
            <p>
              Little details.
              <br />
              <strong>Smoother days.</strong>
            </p>
          </div>
          <Link to="/privacy" className="privacy-link">
            Privacy & data
          </Link>
          <button
            className="signout"
            onClick={() => {
              if (auth) void signOut(auth);
            }}
          >
            <Icon name="logout" /> Sign out
          </button>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <span className="breadcrumb">
            Workspace <span>/</span> <strong>Operations desk</strong>
          </span>
          <div className="topbar-right">
            <span>
              {new Intl.DateTimeFormat('en-IN', {
                timeZone: 'Asia/Calcutta',
                day: 'numeric',
                month: 'short',
                weekday: 'short',
              }).format(new Date())}
            </span>
            <span className="owner-avatar" aria-label="Owner account">
              O
            </span>
          </div>
        </header>
        <main id="main">
          <Suspense fallback={<State loading>Loading</State>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/brief" element={<WeeklyBrief />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <footer className="workspace-footer">
            A little more organised. A little more room to grow.
            <span>PACKBAY · YOUR DAILY DISPATCH</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
export function App() {
  return (
    <Routes>
      <Route path="/privacy" element={<Privacy />} />
      <Route path="*" element={<Workspace />} />
    </Routes>
  );
}
