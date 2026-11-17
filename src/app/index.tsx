import { Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { useAuthStore } from '@/shared/store/auth-store';

export default function IndexScreen() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const sessionUserId = useAuthStore((state) => state.sessionUserId);
  const role = useAuthStore((state) => state.role());

  if (!isHydrated || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text className="mt-3 text-body-lg text-slate-600">Starting FactoryEase…</Text>
      </View>
    );
  }

  if (!sessionUserId || !role) {
    return <Redirect href="/(auth)/login" />;
  }

  if (role === 'employee') {
    return <Redirect href="/(employee)/attendance" />;
  }

  return <Redirect href="/(owner)" />;
}
