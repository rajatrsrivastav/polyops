import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type OfflineActionType =
  | 'expense.create'
  | 'attendance.upsert'
  | 'invoice.create'
  | 'challan.create';

export type OfflineQueueItem = {
  id: string;
  type: OfflineActionType;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError: string | null;
};

type OfflineQueueState = {
  items: OfflineQueueItem[];
  isFlushing: boolean;
  enqueue: (item: Omit<OfflineQueueItem, 'attempts' | 'lastError' | 'createdAt'> & {
    createdAt?: string;
  }) => void;
  remove: (id: string) => void;
  markAttempt: (id: string, error: string | null) => void;
  setFlushing: (value: boolean) => void;
  pendingCount: () => number;
};

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      items: [],
      isFlushing: false,
      enqueue: (item) =>
        set((state) => ({
          items: [
            ...state.items,
            {
              ...item,
              createdAt: item.createdAt ?? new Date().toISOString(),
              attempts: 0,
              lastError: null,
            },
          ],
        })),
      remove: (id) =>
        set((state) => ({
          items: state.items.filter((entry) => entry.id !== id),
        })),
      markAttempt: (id, error) =>
        set((state) => ({
          items: state.items.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  attempts: entry.attempts + 1,
                  lastError: error,
                }
              : entry,
          ),
        })),
      setFlushing: (value) => set({ isFlushing: value }),
      pendingCount: () => get().items.length,
    }),
    {
      name: 'factoryease-offline-queue',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
