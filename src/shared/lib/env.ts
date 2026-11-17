import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || z.string().url().safeParse(value).success, {
    message: 'EXPO_PUBLIC_SUPABASE_URL must be a valid URL',
  });

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: optionalUrl,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string(),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
});

if (!parsed.success) {
  console.warn('Invalid environment configuration', parsed.error.flatten());
}

export const env = {
  supabaseUrl: parsed.success && parsed.data.EXPO_PUBLIC_SUPABASE_URL
    ? parsed.data.EXPO_PUBLIC_SUPABASE_URL
    : null,
  supabaseAnonKey:
    parsed.success && parsed.data.EXPO_PUBLIC_SUPABASE_ANON_KEY
      ? parsed.data.EXPO_PUBLIC_SUPABASE_ANON_KEY
      : null,
};

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
