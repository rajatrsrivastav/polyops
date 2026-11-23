import { Redirect, Stack, router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api, type FactoryProfile } from '../../../lib/api';
import { colors } from '../../../components/ui';

export default function AdminLayout() {
  const profile = useQuery({ queryKey: ['me'], queryFn: () => api<FactoryProfile>('/me') });
  if (profile.data?.role !== 'owner') return <Redirect href="/(staff)" />;

  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colors.paper },
      headerTintColor: colors.ink,
      headerShadowVisible: false,
      headerLeft: () => (
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(staff)');
        }}>
          <Text style={{ color: colors.ink, fontSize: 16 }}>Back</Text>
        </Pressable>
      ),
    }}>
      <Stack.Screen name="materials" options={{ title: 'Material catalog' }} />
      <Stack.Screen name="newOrder" options={{ title: 'New buyer order' }} />
      <Stack.Screen name="reports" options={{ title: 'Operations reports' }} />
      <Stack.Screen name="brief" options={{ title: 'Weekly brief' }} />
    </Stack>
  );
}
