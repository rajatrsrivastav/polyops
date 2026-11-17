import { useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import * as SplashScreen from 'expo-splash-screen';

import { fetchProfile } from '@/features/auth/api/fetch-profile';
import { isSupabaseConfigured } from '@/shared/lib/env';
import { getSupabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/store/auth-store';

async function applySession(session: Session | null): Promise<void> {
  const { setSession, clear, setError } = useAuthStore.getState();

  if (!session?.user) {
    clear();
    return;
  }

  try {
    const profile = await fetchProfile(session.user.id);
    setSession(session.user.id, profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load profile';
    clear();
    setError(message);
    // Drop the auth session if the account has no usable profile.
    try {
      await getSupabase().auth.signOut();
    } catch {
      // ignore sign-out failures during bootstrap
    }
  }
}

/**
 * Restores the SecureStore/AsyncStorage session on launch and keeps Zustand in sync
 * with Supabase auth events (login, logout, token refresh).
 */
export function useAuthBootstrap(): void {
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    async function bootstrap() {
      setLoading(true);

      if (!isSupabaseConfigured()) {
        useAuthStore.getState().clear();
        if (!cancelled) {
          setHydrated(true);
          setLoading(false);
          await SplashScreen.hideAsync().catch(() => undefined);
        }
        return;
      }

      const supabase = getSupabase();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!cancelled) {
        await applySession(session);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        void applySession(nextSession);
      });
      unsubscribe = () => subscription.unsubscribe();

      if (!cancelled) {
        setHydrated(true);
        setLoading(false);
        await SplashScreen.hideAsync().catch(() => undefined);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [setHydrated, setLoading]);
}
