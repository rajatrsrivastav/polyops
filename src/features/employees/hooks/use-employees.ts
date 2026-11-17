import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createEmployee, listEmployees } from '@/features/employees/api';
import type { EmployeeInput } from '@/features/employees/schemas/employee-schema';
import { requireFactoryId, useFactoryContext } from '@/shared/hooks/use-factory-context';
import { queryKeys } from '@/shared/lib/query-keys';
import type { Employee } from '@/shared/types/database';
import { createClientId } from '@/shared/utils/create-client-id';

export function useEmployees() {
  const { factoryId } = useFactoryContext();
  const enabled = Boolean(factoryId);

  const query = useQuery({
    queryKey: queryKeys.employees.all(factoryId ?? 'none'),
    queryFn: () => listEmployees(requireFactoryId(factoryId)),
    enabled,
  });

  return {
    employees: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { factoryId } = useFactoryContext();

  const mutation = useMutation({
    mutationFn: (input: EmployeeInput) =>
      createEmployee({ factoryId: requireFactoryId(factoryId), input }),
    onMutate: async (input) => {
      const fid = requireFactoryId(factoryId);
      const key = queryKeys.employees.all(fid);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Employee[]>(key) ?? [];
      const now = new Date().toISOString();
      const optimistic: Employee = {
        id: `temp_${createClientId()}`,
        factory_id: fid,
        name: input.name,
        phone: input.phone || null,
        is_active: input.is_active ?? true,
        profile_id: null,
        created_at: now,
        updated_at: now,
      };
      queryClient.setQueryData<Employee[]>(key, [...previous, optimistic].sort((a, b) =>
        a.name.localeCompare(b.name),
      ));
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
    createEmployee: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
  };
}
