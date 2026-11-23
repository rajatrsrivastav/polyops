import { View } from 'react-native';
import { FactoryDock } from '../../features/desk/FactoryDock';
import { Redirect, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api, type FactoryProfile } from '../../lib/api';
import { signOut, useSession } from '../../lib/session';
import { Screen, Loading, ErrorNotice, Button, colors } from '../../components/ui';
export default function StaffLayout() {
  const session = useSession();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<FactoryProfile>('/me'),
    enabled: Boolean(session.user),
  });
  if (session.loading)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (!session.user) return <Redirect href="/" />;
  if (me.isPending || me.error)
    return (
      <Screen>
        {me.isPending && <Loading />}
        <ErrorNotice error={me.error} />
        <Button
          title="Retry"
          onPress={() => {
            void me.refetch();
          }}
        />
        <Button
          title="Sign out"
          secondary
          onPress={() => {
            void signOut();
          }}
        />
      </Screen>
    );
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.paper },
          headerTintColor: colors.ink,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="orders/[id]" options={{ title: 'Dispatch details' }} />
        <Stack.Screen name="receive" options={{ title: 'Material stock' }} />
        <Stack.Screen name="dispatch" options={{ title: 'Buyer dispatch' }} />
        <Stack.Screen name="movements/[id]" options={{ title: 'Stock movements' }} />
        <Stack.Screen name="more" options={{ title: 'More' }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack>
      <FactoryDock />
    </View>
  );
}
