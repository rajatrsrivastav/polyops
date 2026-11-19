import { signOut } from 'firebase/auth';
import { auth } from './firebase';
export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; key?: string } = {},
): Promise<T> {
  if (!auth?.currentUser) throw new Error('Sign in to continue');
  const token = await auth.currentUser.getIdToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response: Response;
  try {
    response = await fetch(`${process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '')}/api${path}`, {
      method: options.method ?? 'GET',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(options.key ? { 'Idempotency-Key': options.key } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new Error('Could not reach your shop. Check your connection, then retry.');
  } finally {
    clearTimeout(timeout);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) await signOut(auth);
    throw new Error(data?.error?.message ?? 'Request failed. Please retry.');
  }
  return data as T;
}
export type StaffOrder = {
  _id: string;
  code: string;
  customerName: string;
  status: string;
  channel: string;
  createdAt: string;
  items: { productId: string; name: string; sku: string; qty: number }[];
  statusHistory: { status: string; at: string }[];
};
export type StaffProduct = { _id: string; name: string; sku: string; stock: number };
export type Page<T> = { items: T[]; page: number; limit: number; total: number };
