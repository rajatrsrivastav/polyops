import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { useCustomers } from '@/features/customers/hooks/use-customers';
import { buildInvoiceHtml } from '@/features/documents/pdf/invoice-html';
import { formatMoney } from '@/features/documents/pdf/escape-html';
import { sharePdf } from '@/features/documents/pdf/share-pdf';
import { useFactory } from '@/features/factories/hooks/use-factory';
import { useInvoice } from '@/features/invoices/hooks/use-invoices';
import { EmptyState } from '@/shared/components/EmptyState';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';

function asId(value: string | string[] | undefined): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return null;
}

export default function InvoiceDetailScreen() {
  const invoiceId = asId(useLocalSearchParams<{ id?: string | string[] }>().id);
  const { invoice, isLoading, error, refetch } = useInvoice(invoiceId);
  const { customers } = useCustomers();
  const { factory, isLoading: factoryLoading, error: factoryError } = useFactory();
  const [shareError, setShareError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const customer = useMemo(
    () => customers.find((item) => item.id === invoice?.customer_id) ?? null,
    [customers, invoice?.customer_id],
  );

  async function onShare() {
    if (!invoice || !customer || !factory) {
      setShareError('Invoice details are still loading.');
      return;
    }

    setShareError(null);
    setSharing(true);
    try {
      const html = buildInvoiceHtml({ factory, customer, invoice });
      await sharePdf(html, `Share ${invoice.invoice_number}`);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Could not share PDF');
    } finally {
      setSharing(false);
    }
  }

  if (!invoiceId) {
    return (
      <Screen title="Invoice">
        <EmptyState title="Missing invoice" description="Go back and open an invoice from the list." />
      </Screen>
    );
  }

  return (
    <Screen
      title="Invoice"
      isLoading={isLoading || factoryLoading}
      error={shareError ?? error ?? factoryError}
      footer={
        <View className="gap-3">
          {error || factoryError ? (
            <PrimaryButton label="Retry" variant="secondary" onPress={() => void refetch()} />
          ) : null}
          <PrimaryButton
            label="Share PDF (WhatsApp / Files)"
            onPress={() => void onShare()}
            isLoading={sharing}
            disabled={!invoice || !customer || !factory}
          />
        </View>
      }
    >
      {!invoice ? (
        <EmptyState title="Invoice not found" description="It may have been deleted." />
      ) : (
        <View className="gap-4">
          <View className="rounded-2xl bg-brand-700 px-5 py-5">
            <Text className="text-base font-semibold uppercase text-brand-100">
              {invoice.invoice_number}
            </Text>
            <Text className="mt-2 text-4xl font-bold text-white">
              {formatMoney(invoice.total)}
            </Text>
            <Text className="mt-2 text-base text-brand-100">{invoice.invoice_date}</Text>
          </View>

          <View className="rounded-2xl bg-white px-4 py-4">
            <Text className="text-sm font-semibold uppercase text-slate-500">Customer</Text>
            <Text className="mt-1 text-xl font-semibold text-brand-900">
              {customer?.name ?? 'Unknown customer'}
            </Text>
            {customer?.phone ? (
              <Text className="mt-1 text-body-lg text-slate-600">{customer.phone}</Text>
            ) : null}
          </View>

          <View className="gap-2">
            <Text className="text-xl font-semibold text-brand-900">Preview</Text>
            {invoice.invoice_items.map((item) => (
              <View key={item.id} className="rounded-2xl bg-white px-4 py-4">
                <Text className="text-lg font-semibold text-slate-900">{item.description}</Text>
                <Text className="mt-1 text-body-lg text-slate-600">
                  {item.qty} × {formatMoney(item.rate)} = {formatMoney(item.amount)}
                </Text>
              </View>
            ))}
          </View>

          <View className="rounded-2xl bg-white px-4 py-4">
            <Row label="Subtotal" value={formatMoney(invoice.subtotal)} />
            <Row label="GST / Tax" value={formatMoney(invoice.tax)} />
            <Row label="Total" value={formatMoney(invoice.total)} bold />
          </View>

          {invoice.notes ? (
            <View className="rounded-2xl bg-white px-4 py-4">
              <Text className="text-sm font-semibold uppercase text-slate-500">Notes</Text>
              <Text className="mt-1 text-body-lg text-slate-700">{invoice.notes}</Text>
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className={`text-body-lg ${bold ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
        {label}
      </Text>
      <Text className={`text-body-lg ${bold ? 'font-bold text-slate-900' : 'text-slate-800'}`}>
        {value}
      </Text>
    </View>
  );
}
