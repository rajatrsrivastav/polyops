import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createChallan, getChallan, listChallans } from '@/features/challans/api';
import type { ChallanInput } from '@/features/challans/schemas/challan-schema';
import { requireFactoryId, useFactoryContext } from '@/shared/hooks/use-factory-context';
import { queryKeys } from '@/shared/lib/query-keys';
import type { Challan } from '@/shared/types/database';
import { createClientId } from '@/shared/utils/create-client-id';

export function useChallans() {
  const { factoryId } = useFactoryContext();
  const enabled = Boolean(factoryId);

  const query = useQuery({
    queryKey: queryKeys.challans.all(factoryId ?? 'none'),
    queryFn: () => listChallans(requireFactoryId(factoryId)),
    enabled,
  });

  return {
    challans: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useChallan(challanId: string | null) {
  const { factoryId } = useFactoryContext();
  const enabled = Boolean(factoryId && challanId);

  const query = useQuery({
    queryKey: queryKeys.challans.detail(factoryId ?? 'none', challanId ?? 'none'),
    queryFn: () => getChallan(requireFactoryId(factoryId), challanId as string),
    enabled,
  });

  return {
    challan: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useCreateChallan() {
  const queryClient = useQueryClient();
  const { factoryId } = useFactoryContext();

  const mutation = useMutation({
    mutationFn: (input: ChallanInput) =>
      createChallan({ factoryId: requireFactoryId(factoryId), input }),
    onMutate: async (input) => {
      const fid = requireFactoryId(factoryId);
      const key = queryKeys.challans.all(fid);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Challan[]>(key) ?? [];

      const optimistic: Challan = {
        id: `temp_${createClientId()}`,
        client_id: createClientId(),
        factory_id: fid,
        customer_id: input.customer_id,
        challan_number: input.challan_number || 'DC-DRAFT',
        challan_date: input.challan_date,
        vehicle_no: input.vehicle_no || null,
        notes: input.notes || null,
        status: 'final',
        pdf_url: null,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Challan[]>(key, [optimistic, ...previous]);
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
    createChallan: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
  };
}
