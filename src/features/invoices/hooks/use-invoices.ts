import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createInvoice, getInvoice, listInvoices } from '@/features/invoices/api';
import type { InvoiceInput } from '@/features/invoices/schemas/invoice-schema';
import { requireFactoryId, useFactoryContext } from '@/shared/hooks/use-factory-context';
import { queryKeys } from '@/shared/lib/query-keys';
import type { Invoice } from '@/shared/types/database';
import { createClientId } from '@/shared/utils/create-client-id';

export function useInvoices() {
  const { factoryId } = useFactoryContext();
  const enabled = Boolean(factoryId);

  const query = useQuery({
    queryKey: queryKeys.invoices.all(factoryId ?? 'none'),
    queryFn: () => listInvoices(requireFactoryId(factoryId)),
    enabled,
  });

  return {
    invoices: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useInvoice(invoiceId: string | null) {
  const { factoryId } = useFactoryContext();
  const enabled = Boolean(factoryId && invoiceId);

  const query = useQuery({
    queryKey: queryKeys.invoices.detail(factoryId ?? 'none', invoiceId ?? 'none'),
    queryFn: () => getInvoice(requireFactoryId(factoryId), invoiceId as string),
    enabled,
  });

  return {
    invoice: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { factoryId } = useFactoryContext();

  const mutation = useMutation({
    mutationFn: (input: InvoiceInput) =>
      createInvoice({ factoryId: requireFactoryId(factoryId), input }),
    onMutate: async (input) => {
      const fid = requireFactoryId(factoryId);
      const key = queryKeys.invoices.all(fid);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Invoice[]>(key) ?? [];

      const subtotal = input.items.reduce((sum, item) => sum + item.qty * item.rate, 0);
      const tax = input.tax ?? 0;
      const optimistic: Invoice = {
        id: `temp_${createClientId()}`,
        client_id: createClientId(),
        factory_id: fid,
        customer_id: input.customer_id,
        invoice_number: input.invoice_number || 'INV-DRAFT',
        invoice_date: input.invoice_date,
        status: 'final',
        subtotal,
        tax,
        total: subtotal + tax,
        notes: input.notes || null,
        pdf_url: null,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Invoice[]>(key, [optimistic, ...previous]);
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
    createInvoice: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
  };
}
