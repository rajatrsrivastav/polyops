import { bearerFetch } from './bearerFetch';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
const TOKEN_KEY = 'packbay.bearer';
type SessionUser = { id: string };
const listeners = new Set<() => void>();
let memoryToken: string | null = null;
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10000, retry: false }, mutations: { retry: false } },
});
export const configured = Boolean(process.env.EXPO_PUBLIC_API_URL);
function emit() {
  for (const listener of listeners) listener();
}
export function getAccessToken() {
  return memoryToken;
}
async function persist(token: string | null) {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
  memoryToken = token;
  emit();
}
export async function signIn(email: string, password: string) {
  const base = process.env.EXPO_PUBLIC_API_URL;
  if (!base) throw new Error('The API address has not been configured');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response: Response;
  let data: { token?: unknown; code?: string; error?: { code?: string } } | null;
  try {
    response = await bearerFetch(`${base.replace(/\/$/, '')}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      signal: controller.signal,
    });
    data = await response.json().catch(() => null);
  } catch {
    throw new Error('Could not reach the factory API. Check the connection and try again.');
  } finally {
    clearTimeout(timeout);
  }
  if (response.status === 401) throw new Error('Email or password incorrect. Use the password set for this account.');
  if (response.status === 403) {
    const code = data?.code ?? data?.error?.code;
    if (code === 'MISSING_OR_NULL_ORIGIN') throw new Error('The API rejected the sign-in origin. Reload the updated Expo app and retry.');
    if (code === 'INVALID_ORIGIN' || code === 'CORS_DENIED') throw new Error('The API does not trust this sign-in origin. Check the server’s allowed origins.');
  }
  if (response.status === 429) throw new Error('Too many attempts. Wait a moment before trying again.');
  if (!response.ok) throw new Error(`The API could not complete sign-in (HTTP ${response.status}).`);
  const token = response.headers.get('set-auth-token') || data?.token;
  if (typeof token !== 'string' || !token) throw new Error('No session returned. Check that the mobile API address points to the factory server.');
  try {
    await persist(token);
  } catch {
    throw new Error('The phone could not save the session. Reopen the app and try again.');
  }
}
export async function signOut() {
  const token = memoryToken;
  const base = process.env.EXPO_PUBLIC_API_URL;
  await persist(null);
  queryClient.clear();
  if (!token || !base) return;
  await bearerFetch(`${base.replace(/\/$/, '')}/api/auth/sign-out`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: '{}',
  }).catch(() => undefined);
}
const Context = createContext<{ user: SessionUser | null; loading: boolean }>({
  user: null,
  loading: true,
});
export function SessionProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<{ user: SessionUser | null; loading: boolean }>({
    user: null,
    loading: true,
  });
  useEffect(() => {
    let active = true;
    const sync = () => {
      queryClient.clear();
      setValue({ user: memoryToken ? { id: 'signed-in' } : null, loading: false });
    };
    listeners.add(sync);
    void AsyncStorage.getItem(TOKEN_KEY).then((token) => {
      memoryToken = token;
      if (!active) return;
      queryClient.clear();
      setValue({ user: token ? { id: 'signed-in' } : null, loading: false });
    });
    return () => {
      active = false;
      listeners.delete(sync);
    };
  }, []);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useSession() {
  return useContext(Context);
}
