import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '@/shared/store/auth-store';

/**
 * Guests only. Signed-in users are bounced to their role home.
 */
export default function AuthLayout() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const sessionUserId = useAuthStore((state) => state.sessionUserId);
  const role = useAuthStore((state) => state.role());

  if (!isHydrated || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  if (sessionUserId && role === 'employee') {
    return <Redirect href="/(employee)/attendance" />;
  }

  if (sessionUserId && role === 'owner') {
    return <Redirect href="/(owner)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
