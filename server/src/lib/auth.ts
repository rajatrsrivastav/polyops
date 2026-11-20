import type { IncomingMessage, ServerResponse } from 'node:http';
import { getPool, type SqlPool } from '../db/pool';
import { nativeImport } from './nativeImport';
type SessionResult = { user?: { id?: string } | null } | null;
type AuthApi = {
  handler: (request: Request) => Promise<Response>;
  api: {
    getSession: (input: { headers: Headers }) => Promise<SessionResult>;
  };
};
export type AuthSettings = {
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
};
let settings: AuthSettings | null = null;
let authApi: AuthApi | null = null;
export function initAuth(next: AuthSettings) {
  settings = next;
  authApi = null;
}
async function authSettings() {
  if (settings) return settings;
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || !baseURL) throw new Error('Auth is not configured');
  settings = { secret, baseURL, trustedOrigins: [] };
  return settings;
}
export async function getAuth() {
  if (authApi) return authApi;
  const authMod = await nativeImport<typeof import('better-auth')>('better-auth');
  const bearerMod = await nativeImport<typeof import('better-auth/plugins/bearer')>(
    'better-auth/plugins/bearer',
  );
  const configured = await authSettings();
  const database: SqlPool = getPool();
  authApi = authMod.betterAuth({
    database,
    secret: configured.secret,
    baseURL: configured.baseURL,
    trustedOrigins: configured.trustedOrigins,
    emailAndPassword: { enabled: true, disableSignUp: true },
    plugins: [bearerMod.bearer()],
  });
  return authApi;
}
let nodeHandler: ((req: IncomingMessage, res: ServerResponse) => Promise<void>) | null = null;
export async function handleAuthRequest(req: IncomingMessage, res: ServerResponse) {
  if (!nodeHandler) {
    const { toNodeHandler } = await nativeImport<typeof import('better-auth/node')>('better-auth/node');
    nodeHandler = toNodeHandler(await getAuth());
  }
  await nodeHandler(req, res);
}
