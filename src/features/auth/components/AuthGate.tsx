import { Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import type { UserRole } from '@/features/auth/schemas/profile-schema';
import { useAuthStore } from '@/shared/store/auth-store';

type AuthGateProps = {
  /** Roles allowed to render children. Omit to require any authenticated user. */
  allow?: UserRole[];
  children: ReactNode;
};

export function AuthGate({ allow, children }: AuthGateProps) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const sessionUserId = useAuthStore((state) => state.sessionUserId);
  const profile = useAuthStore((state) => state.profile);
  const error = useAuthStore((state) => state.error);

  if (!isHydrated || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text className="mt-3 text-body-lg text-slate-600">Checking sign-in…</Text>
      </View>
    );
  }

  if (!sessionUserId || !profile) {
    return <Redirect href="/(auth)/login" />;
  }

  if (allow && !allow.includes(profile.role)) {
    if (profile.role === 'employee') {
      return <Redirect href="/(employee)/attendance" />;
    }
    return <Redirect href="/(owner)" />;
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <Text className="text-center text-body-lg text-red-700">{error}</Text>
      </View>
    );
  }

  return <>{children}</>;
}
