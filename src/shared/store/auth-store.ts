import { create } from 'zustand';

import type { Profile, UserRole } from '@/features/auth/schemas/profile-schema';

type AuthState = {
  isHydrated: boolean;
  isLoading: boolean;
  sessionUserId: string | null;
  profile: Profile | null;
  error: string | null;
  setHydrated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setSession: (userId: string | null, profile: Profile | null) => void;
  setError: (message: string | null) => void;
  clear: () => void;
  role: () => UserRole | null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isHydrated: false,
  isLoading: false,
  sessionUserId: null,
  profile: null,
  error: null,
  setHydrated: (value) => set({ isHydrated: value }),
  setLoading: (value) => set({ isLoading: value }),
  setSession: (userId, profile) =>
    set({
      sessionUserId: userId,
      profile,
      error: null,
    }),
  setError: (message) => set({ error: message }),
  clear: () =>
    set({
      sessionUserId: null,
      profile: null,
      error: null,
      isLoading: false,
    }),
  role: () => get().profile?.role ?? null,
}));
