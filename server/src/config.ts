import { z } from 'zod';
const originList = z
  .string()
  .min(1)
  .transform((s) => s.split(',').map((v) => v.trim()))
  .refine(
    (origins) =>
      origins.every((origin) => {
        try {
          const url = new URL(origin);
          return (
            ['http:', 'https:'].includes(url.protocol) &&
            url.origin === origin &&
            !origin.includes('*')
          );
        } catch {
          return false;
        }
      }),
    'Must contain exact HTTP origins',
  );
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().regex(/^postgres(?:ql)?:\/\//),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  SENTRY_DSN: z.url().optional(),
  RELEASE_SHA: z.string().optional(),
  CORS_ORIGINS: originList,
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
});
export function readConfig(env: NodeJS.ProcessEnv) {
  const parsed = schema.safeParse(env);
  if (!parsed.success)
    throw new Error(
      `Invalid configuration variables: ${[...new Set(parsed.error.issues.map((i) => i.path.join('.')))].join(', ')}`,
    );
  if (
    parsed.data.NODE_ENV === 'production' &&
    parsed.data.CORS_ORIGINS.some((origin) => !origin.startsWith('https://'))
  )
    throw new Error('Invalid configuration variables: CORS_ORIGINS (production requires HTTPS)');
  return parsed.data;
}
export type Config = ReturnType<typeof readConfig>;
