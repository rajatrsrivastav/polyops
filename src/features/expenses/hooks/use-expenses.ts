import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createExpense,
  deleteExpense,
  getExpense,
  listExpenses,
  updateExpense,
} from '@/features/expenses/api';
import type { ExpenseInput } from '@/features/expenses/schemas/expense-schema';
import {
  requireFactoryId,
  requireUserId,
  useFactoryContext,
} from '@/shared/hooks/use-factory-context';
import { getIsOnline } from '@/shared/store/network-store';
import { useOfflineQueueStore } from '@/shared/store/offline-queue-store';
import { toast } from '@/shared/store/toast-store';
import { queryKeys } from '@/shared/lib/query-keys';
import type { Expense } from '@/shared/types/database';
import { createClientId } from '@/shared/utils/create-client-id';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/shared/store/locale-store';

export function useExpenses() {
  const { factoryId } = useFactoryContext();
  const enabled = Boolean(factoryId);

  const query = useQuery({
    queryKey: queryKeys.expenses.all(factoryId ?? 'none'),
    queryFn: () => listExpenses(requireFactoryId(factoryId)),
    enabled,
  });

  return {
    expenses: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useExpense(expenseId: string | null) {
  const { factoryId } = useFactoryContext();
  const enabled = Boolean(factoryId && expenseId);

  const query = useQuery({
    queryKey: [...queryKeys.expenses.all(factoryId ?? 'none'), expenseId ?? 'none'] as const,
    queryFn: () => getExpense(requireFactoryId(factoryId), expenseId as string),
    enabled,
  });

  return {
    expense: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

type SaveExpenseVars = {
  input: ExpenseInput;
  localPhotoUri?: string | null;
};

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { factoryId, userId } = useFactoryContext();

  const mutation = useMutation({
    mutationFn: async ({ input, localPhotoUri }: SaveExpenseVars) => {
      const fid = requireFactoryId(factoryId);
      const uid = requireUserId(userId);
      const clientId = createClientId();

      if (!getIsOnline()) {
        useOfflineQueueStore.getState().enqueue({
          id: clientId,
          type: 'expense.create',
          payload: {
            factoryId: fid,
            userId: uid,
            input,
            localPhotoUri: localPhotoUri ?? null,
            clientId,
          },
        });
        toast.info(translate(useLocaleStore.getState().locale, 'common.offlineQueued'));
        return {
          id: `temp_${clientId}`,
          client_id: clientId,
          factory_id: fid,
          created_by: uid,
          amount: input.amount,
          category: input.category,
          description: input.description || null,
          photo_url: localPhotoUri || input.photo_url || null,
          created_at: new Date().toISOString(),
        } satisfies Expense;
      }

      return createExpense({
        factoryId: fid,
        userId: uid,
        input,
        localPhotoUri,
        clientId,
      });
    },
    onMutate: async ({ input, localPhotoUri }) => {
      const fid = requireFactoryId(factoryId);
      const uid = requireUserId(userId);
      const key = queryKeys.expenses.all(fid);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<Expense[]>(key) ?? [];
      const optimistic: Expense = {
        id: `temp_${createClientId()}`,
        client_id: createClientId(),
        factory_id: fid,
        created_by: uid,
        amount: input.amount,
        category: input.category,
        description: input.description || null,
        photo_url: localPhotoUri || input.photo_url || null,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Expense[]>(key, [optimistic, ...previous]);
      return { previous, key };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
      toast.error(err instanceof Error ? err.message : 'Could not save expense');
    },
    onSuccess: (created, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData<Expense[]>(context.key, (current = []) => [
        created,
        ...current.filter((item) => !item.id.startsWith('temp_')),
      ]);
    },
    onSettled: (_data, _err, _vars, context) => {
      if (!getIsOnline()) return;
      if (context?.key) void queryClient.invalidateQueries({ queryKey: context.key });
    },
  });

  return {
    createExpense: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
  };
}

type UpdateExpenseVars = SaveExpenseVars & {
  expenseId: string;
  previousPhotoPath?: string | null;
  removePhoto?: boolean;
};

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { factoryId } = useFactoryContext();

  const mutation = useMutation({
    mutationFn: (vars: UpdateExpenseVars) =>
      updateExpense({
        factoryId: requireFactoryId(factoryId),
        expenseId: vars.expenseId,
        input: vars.input,
        localPhotoUri: vars.localPhotoUri,
        previousPhotoPath: vars.previousPhotoPath,
        removePhoto: vars.removePhoto,
      }),
    onMutate: async (vars) => {
      const fid = requireFactoryId(factoryId);
      const key = queryKeys.expenses.all(fid);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Expense[]>(key) ?? [];

      queryClient.setQueryData<Expense[]>(key, (current = []) =>
        current.map((item) =>
          item.id === vars.expenseId
            ? {
                ...item,
                amount: vars.input.amount,
                category: vars.input.category,
                description: vars.input.description || null,
                photo_url: vars.removePhoto
                  ? null
                  : vars.localPhotoUri || vars.input.photo_url || item.photo_url,
              }
            : item,
        ),
      );

      return { previous, key };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
    },
    onSettled: (_data, _err, _vars, context) => {
      if (context?.key) void queryClient.invalidateQueries({ queryKey: context.key });
    },
  });

  return {
    updateExpense: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
  };
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { factoryId } = useFactoryContext();

  const mutation = useMutation({
    mutationFn: (expense: Expense) =>
      deleteExpense({ factoryId: requireFactoryId(factoryId), expense }),
    onMutate: async (expense) => {
      const fid = requireFactoryId(factoryId);
      const key = queryKeys.expenses.all(fid);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Expense[]>(key) ?? [];
      queryClient.setQueryData<Expense[]>(
        key,
        previous.filter((item) => item.id !== expense.id),
      );
      return { previous, key };
    },
    onError: (_err, _expense, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
    },
    onSettled: (_data, _err, _vars, context) => {
      if (context?.key) void queryClient.invalidateQueries({ queryKey: context.key });
    },
  });

  return {
    deleteExpense: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
  };
}
