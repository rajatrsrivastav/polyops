import '../global.css';

import { type ReactNode } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { useAuthBootstrap } from '@/features/auth/hooks/use-auth-bootstrap';
import { useOfflineSync } from '@/shared/hooks/use-offline-sync';
import { queryClient, queryPersister } from '@/shared/lib/query-client';
import { ToastHost } from '@/shared/components/ToastHost';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppProviders({ children }: { children: ReactNode }) {
  useAuthBootstrap();
  useOfflineSync();
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.state.status === 'success',
        },
      }}
    >
      <AppProviders>
        <StatusBar style="dark" />
        <ToastHost />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f8fafc' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(owner)" />
          <Stack.Screen name="(employee)" />
        </Stack>
      </AppProviders>
    </PersistQueryClientProvider>
  );
}
