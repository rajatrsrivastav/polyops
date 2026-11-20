import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { queryClient } from './queryClient';
const TOKEN_KEY = 'packbay.bearer';
type SessionUser = { id: string };
const listeners = new Set<() => void>();
export const authConfigured = Boolean(import.meta.env.VITE_API_URL);
function readToken() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
function emit() {
  for (const listener of listeners) listener();
}
export function getAccessToken() {
  return readToken();
}
export async function signIn(email: string, password: string) {
  const base = import.meta.env.VITE_API_URL;
  if (!base) throw new Error('The API address has not been configured');
  const response = await fetch(`${String(base).replace(/\/$/, '')}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = (await response.json().catch(() => null)) as { token?: string | null } | null;
  const token = response.headers.get('set-auth-token') || data?.token || '';
  if (!response.ok || !token) throw new Error('Sign-in failed');
  localStorage.setItem(TOKEN_KEY, token);
  emit();
}
export async function signOut() {
  const token = readToken();
  const base = import.meta.env.VITE_API_URL;
  localStorage.removeItem(TOKEN_KEY);
  emit();
  queryClient.clear();
  if (!token || !base) return;
  await fetch(`${String(base).replace(/\/$/, '')}/api/auth/sign-out`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: '{}',
  }).catch(() => undefined);
}
const SessionContext = createContext<{ user: SessionUser | null; loading: boolean }>({
  user: null,
  loading: false,
});
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => (readToken() ? { id: 'signed-in' } : null));
  useEffect(() => {
    const sync = () => {
      queryClient.clear();
      setUser(readToken() ? { id: 'signed-in' } : null);
    };
    listeners.add(sync);
    queryClient.clear();
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return <SessionContext.Provider value={{ user, loading: false }}>{children}</SessionContext.Provider>;
}
export function useSession() {
  return useContext(SessionContext);
}
