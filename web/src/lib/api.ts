import { signOut } from 'firebase/auth';
import { auth } from './firebase';
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; key?: string } = {},
): Promise<T> {
  if (!auth?.currentUser) throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in to continue');
  const token = await auth.currentUser.getIdToken();
  const base = import.meta.env.VITE_API_URL;
  if (!base) throw new ApiError(0, 'CONFIGURATION', 'The API address has not been configured');
  let response: Response;
  try {
    response = await fetch(`${base.replace(/\/$/, '')}/api${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(options.key ? { 'Idempotency-Key': options.key } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK',
      'We could not reach your shop. Check your connection and retry.',
    );
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) await signOut(auth);
    throw new ApiError(
      response.status,
      data?.error?.code ?? 'UNKNOWN',
      data?.error?.message ?? 'The request failed. Please retry.',
    );
  }
  return data as T;
}
