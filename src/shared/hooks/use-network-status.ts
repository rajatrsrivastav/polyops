import { useNetworkStore } from '@/shared/store/network-store';

export function useNetworkStatus() {
  const isOnline = useNetworkStore((state) => state.isOnline);
  const isChecking = useNetworkStore((state) => state.isChecking);
  return { isOnline, isChecking };
}
