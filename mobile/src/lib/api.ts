import { bearerFetch } from './bearerFetch';
import { getAccessToken, signOut } from './session';
export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; key?: string } = {},
): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new Error('Sign in to continue');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response: Response;
  try {
    response = await bearerFetch(`${process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '')}/api${path}`, {
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
    throw new Error('Could not reach the factory API. Check your connection, then retry.');
  } finally {
    clearTimeout(timeout);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) await signOut();
    throw new Error(data?.error?.message ?? 'Request failed. Please retry.');
  }
  return data as T;
}
export type StaffOrder = {
  _id: string;
  code: string;
  customerName: string;
  customerPhone?: string;
  subtotalPaise?: number;
  status: string;
  channel: string;
  createdAt: string;
  items: { productId: string; name: string; sku: string; qty: number; unitPricePaise?: number }[];
  statusHistory: { status: string; at: string }[];
};
export type StaffProduct = { _id: string; name: string; sku: string; stock: number };
export type Page<T> = { items: T[]; page: number; limit: number; total: number };

export type FactoryProfile = { role: 'owner' | 'staff'; shopName?: string };
export type StockMovement = {
  _id: string;
  type: 'receive' | 'reserve' | 'restock';
  qty: number;
  balanceAfter: number;
  note?: string;
  createdAt: string;
};
