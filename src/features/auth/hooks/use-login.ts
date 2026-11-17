import { useState } from 'react';

import { fetchProfile } from '@/features/auth/api/fetch-profile';
import { loginSchema, type LoginInput } from '@/features/auth/schemas/login-schema';
import type { UserRole } from '@/features/auth/schemas/profile-schema';
import { isSupabaseConfigured } from '@/shared/lib/env';
import { getSupabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/store/auth-store';

type LoginResult =
  | { ok: true; role: UserRole }
  | { ok: false; error: string };

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  async function login(raw: LoginInput): Promise<LoginResult> {
    setError(null);

    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid login details';
      setError(message);
      return { ok: false, error: message };
    }

    if (!isSupabaseConfigured()) {
      const message =
        'Supabase is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.';
      setError(message);
      return { ok: false, error: message };
    }

    setIsLoading(true);
    try {
      const supabase = getSupabase();
      const { data, error: authError } = await supabase.auth.signInWithPassword(parsed.data);

      if (authError || !data.user) {
        const message = authError?.message ?? 'Sign in failed';
        setError(message);
        return { ok: false, error: message };
      }

      const profile = await fetchProfile(data.user.id);
      setSession(data.user.id, profile);
      return { ok: true, role: profile.role };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected sign-in error';
      setError(message);
      try {
        await getSupabase().auth.signOut();
      } catch {
        // ignore
      }
      useAuthStore.getState().clear();
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }

  return { login, isLoading, error, setError };
}
