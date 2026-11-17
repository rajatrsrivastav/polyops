import { useQuery } from '@tanstack/react-query';

import { getFactory } from '@/features/factories/api';
import { requireFactoryId, useFactoryContext } from '@/shared/hooks/use-factory-context';

export function useFactory() {
  const { factoryId } = useFactoryContext();
  const enabled = Boolean(factoryId);

  const query = useQuery({
    queryKey: ['factory', factoryId ?? 'none'] as const,
    queryFn: () => getFactory(requireFactoryId(factoryId)),
    enabled,
  });

  return {
    factory: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
