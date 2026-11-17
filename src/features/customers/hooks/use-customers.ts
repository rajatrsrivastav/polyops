import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from '@/features/customers/api';
import type { CustomerInput } from '@/features/customers/schemas/customer-schema';
import { requireFactoryId, useFactoryContext } from '@/shared/hooks/use-factory-context';
import { queryKeys } from '@/shared/lib/query-keys';
import type { Customer } from '@/shared/types/database';
import { createClientId } from '@/shared/utils/create-client-id';

export function useCustomers() {
  const { factoryId } = useFactoryContext();
  const enabled = Boolean(factoryId);

  const query = useQuery({
    queryKey: queryKeys.customers.all(factoryId ?? 'none'),
    queryFn: () => listCustomers(requireFactoryId(factoryId)),
    enabled,
  });

  return {
    customers: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useCustomer(customerId: string | null) {
  const { factoryId } = useFactoryContext();
  const enabled = Boolean(factoryId && customerId);

  const query = useQuery({
    queryKey: [...queryKeys.customers.all(factoryId ?? 'none'), customerId ?? 'none'] as const,
    queryFn: () => getCustomer(requireFactoryId(factoryId), customerId as string),
    enabled,
  });

  return {
    customer: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { factoryId } = useFactoryContext();

  const mutation = useMutation({
    mutationFn: (input: CustomerInput) =>
      createCustomer({ factoryId: requireFactoryId(factoryId), input }),
    onMutate: async (input) => {
      const fid = requireFactoryId(factoryId);
      const key = queryKeys.customers.all(fid);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Customer[]>(key) ?? [];
      const now = new Date().toISOString();
      const optimistic: Customer = {
        id: `temp_${createClientId()}`,
        factory_id: fid,
        name: input.name,
        phone: input.phone || null,
        address: input.address || null,
        gstin: input.gstin || null,
        created_at: now,
        updated_at: now,
      };
      queryClient.setQueryData<Customer[]>(
        key,
        [...previous, optimistic].sort((a, b) => a.name.localeCompare(b.name)),
      );
      return { previous, key };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
    },
    onSettled: (_data, _err, _vars, context) => {
      if (context?.key) void queryClient.invalidateQueries({ queryKey: context.key });
    },
  });

  return {
    createCustomer: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
  };
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { factoryId } = useFactoryContext();

  const mutation = useMutation({
    mutationFn: (vars: { customerId: string; input: CustomerInput }) =>
      updateCustomer({
        factoryId: requireFactoryId(factoryId),
        customerId: vars.customerId,
        input: vars.input,
      }),
    onMutate: async (vars) => {
      const fid = requireFactoryId(factoryId);
      const key = queryKeys.customers.all(fid);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Customer[]>(key) ?? [];
      queryClient.setQueryData<Customer[]>(key, (current = []) =>
        current.map((item) =>
          item.id === vars.customerId
            ? {
                ...item,
                name: vars.input.name,
                phone: vars.input.phone || null,
                address: vars.input.address || null,
                gstin: vars.input.gstin || null,
                updated_at: new Date().toISOString(),
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
    updateCustomer: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
  };
}
