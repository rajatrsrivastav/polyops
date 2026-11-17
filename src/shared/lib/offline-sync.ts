import { upsertAttendance } from '@/features/attendance/api';
import type { AttendanceMarkInput } from '@/features/attendance/schemas/attendance-schema';
import { createExpense } from '@/features/expenses/api';
import type { ExpenseInput } from '@/features/expenses/schemas/expense-schema';
import { queryClient } from '@/shared/lib/query-client';
import { toast } from '@/shared/store/toast-store';
import {
  useOfflineQueueStore,
  type OfflineQueueItem,
} from '@/shared/store/offline-queue-store';

type ExpenseQueuePayload = {
  factoryId: string;
  userId: string;
  input: ExpenseInput;
  localPhotoUri?: string | null;
  clientId: string;
};

type AttendanceQueuePayload = {
  factoryId: string;
  userId: string;
  input: AttendanceMarkInput;
};

async function processItem(item: OfflineQueueItem): Promise<void> {
  if (item.type === 'expense.create') {
    const payload = item.payload as ExpenseQueuePayload;
    await createExpense({
      factoryId: payload.factoryId,
      userId: payload.userId,
      input: payload.input,
      localPhotoUri: payload.localPhotoUri,
      clientId: payload.clientId,
    });
    return;
  }

  if (item.type === 'attendance.upsert') {
    const payload = item.payload as AttendanceQueuePayload;
    await upsertAttendance({
      factoryId: payload.factoryId,
      userId: payload.userId,
      input: payload.input,
    });
    return;
  }

  // Other types reserved for later phases.
  throw new Error(`Unsupported offline action: ${item.type}`);
}

export async function flushOfflineQueue(): Promise<number> {
  const store = useOfflineQueueStore.getState();
  if (store.isFlushing || store.items.length === 0) {
    return 0;
  }

  store.setFlushing(true);
  let synced = 0;

  try {
    // Snapshot so new enqueues during flush are left for the next pass.
    const pending = [...store.items];

    for (const item of pending) {
      try {
        await processItem(item);
        useOfflineQueueStore.getState().remove(item.id);
        synced += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed';
        useOfflineQueueStore.getState().markAttempt(item.id, message);
      }
    }

    if (synced > 0) {
      await queryClient.invalidateQueries();
      toast.success(
        synced === 1 ? '1 offline change synced' : `${synced} offline changes synced`,
      );
    }
  } finally {
    useOfflineQueueStore.getState().setFlushing(false);
  }

  return synced;
}
