import { Redirect, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { signOut } from 'firebase/auth';
import { useSession } from '../../lib/session';
import { api } from '../../lib/api';
import { auth } from '../../lib/firebase';
import { Screen, Loading, ErrorNotice, Button } from '../../components/ui';
export default function StaffLayout() {
  const session = useSession();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ role: 'owner' | 'staff' }>('/me'),
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
            if (auth) void signOut(auth);
          }}
        />
      </Screen>
    );
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F6F4EF' },
        headerTintColor: '#1B3A4B',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Packbay · Your packing desk' }} />
      <Stack.Screen name="orders/[id]" options={{ title: 'Parcel details' }} />
      <Stack.Screen name="receive" options={{ title: 'Receive stock' }} />
    </Stack>
  );
}
