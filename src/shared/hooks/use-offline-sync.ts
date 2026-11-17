import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';

import { flushOfflineQueue } from '@/shared/lib/offline-sync';
import { useNetworkStore } from '@/shared/store/network-store';
import { useOfflineQueueStore } from '@/shared/store/offline-queue-store';

/**
 * Keeps network status fresh and flushes the offline write queue on reconnect.
 */
export function useOfflineSync(): void {
  const setOnline = useNetworkStore((state) => state.setOnline);
  const wasOnline = useRef(true);
  const pendingCount = useOfflineQueueStore((state) => state.items.length);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setOnline(online);

      if (online && !wasOnline.current) {
        void flushOfflineQueue();
      }
      wasOnline.current = online;
    });

    void NetInfo.fetch().then((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setOnline(online);
      wasOnline.current = online;
      if (online) {
        void flushOfflineQueue();
      }
    });

    return () => unsubscribe();
  }, [setOnline]);

  // If items appear while already online (rare), try a flush.
  useEffect(() => {
    if (pendingCount > 0 && useNetworkStore.getState().isOnline) {
      void flushOfflineQueue();
    }
  }, [pendingCount]);
}
