import { useAuthStore } from '@/shared/store/auth-store';

export function useFactoryContext() {
  const profile = useAuthStore((state) => state.profile);
  const userId = useAuthStore((state) => state.sessionUserId);

  return {
    factoryId: profile?.factory_id ?? null,
    userId,
    role: profile?.role ?? null,
  };
}

export function requireFactoryId(factoryId: string | null): string {
  if (!factoryId) {
    throw new Error('Your account is not linked to a factory yet.');
  }
  return factoryId;
}

export function requireUserId(userId: string | null): string {
  if (!userId) {
    throw new Error('You must be signed in.');
  }
  return userId;
}
