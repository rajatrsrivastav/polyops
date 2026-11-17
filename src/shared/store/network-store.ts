import { create } from 'zustand';

type NetworkState = {
  isOnline: boolean;
  isChecking: boolean;
  setOnline: (value: boolean) => void;
  setChecking: (value: boolean) => void;
};

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true,
  isChecking: true,
  setOnline: (value) => set({ isOnline: value, isChecking: false }),
  setChecking: (value) => set({ isChecking: value }),
}));

export function getIsOnline(): boolean {
  return useNetworkStore.getState().isOnline;
}
