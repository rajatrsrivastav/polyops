import { useState } from 'react';
import { router } from 'expo-router';

import { isSupabaseConfigured } from '@/shared/lib/env';
import { getSupabase } from '@/shared/lib/supabase';
import { queryClient } from '@/shared/lib/query-client';
import { useAuthStore } from '@/shared/store/auth-store';

type LogoutResult = { ok: true } | { ok: false; error: string };

export function useLogout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clear = useAuthStore((state) => state.clear);

  async function logout(): Promise<LogoutResult> {
    setError(null);
    setIsLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { error: signOutError } = await getSupabase().auth.signOut();
        if (signOutError) {
          setError(signOutError.message);
          return { ok: false, error: signOutError.message };
        }
      }

      clear();
      queryClient.clear();
      router.replace('/(auth)/login');
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }

  return { logout, isLoading, error };
}
