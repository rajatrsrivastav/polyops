import { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { todayIsoDate } from '@/features/attendance/utils/dates';
import { useCustomers } from '@/features/customers/hooks/use-customers';
import { CustomerPicker } from '@/features/documents/components/CustomerPicker';
import { GstChips } from '@/features/documents/components/GstChips';
import { InvoiceLineItemsEditor } from '@/features/documents/components/InvoiceLineItemsEditor';
import { formatMoney } from '@/features/documents/pdf/escape-html';
import { computeInvoiceTotals, taxFromGstPercent } from '@/features/invoices/api';
import { useCreateInvoice } from '@/features/invoices/hooks/use-invoices';
import {
  invoiceSchema,
  type InvoiceItemInput,
} from '@/features/invoices/schemas/invoice-schema';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';

export default function InvoiceNewScreen() {
  const { customers, isLoading: customersLoading, error: customersError } = useCustomers();
  const { createInvoice, isLoading, error: mutationError, reset } = useCreateInvoice();

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [items, setItems] = useState<InvoiceItemInput[]>([
    { description: '', qty: 1, rate: 0 },
  ]);
  const [gstPercent, setGstPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId && customers[0]) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  const subtotal = useMemo(
    () => computeInvoiceTotals(items, 0).subtotal,
    [items],
  );
  const tax = useMemo(() => taxFromGstPercent(subtotal, gstPercent), [subtotal, gstPercent]);
  const totals = useMemo(() => computeInvoiceTotals(items, tax), [items, tax]);

  async function onSave() {
    setError(null);
    reset();

    const parsed = invoiceSchema.safeParse({
      customer_id: customerId,
      invoice_date: todayIsoDate(),
      invoice_number: '',
      tax: totals.tax,
      notes,
      items,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check invoice details');
      return;
    }

    try {
      const created = await createInvoice(parsed.data);
      router.replace(`/(owner)/invoice/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create invoice');
    }
  }

  return (
    <Screen
      title="New invoice"
      isLoading={customersLoading}
      error={error ?? mutationError ?? customersError}
      footer={
        <View className="gap-3">
          <View className="rounded-2xl bg-brand-50 px-4 py-3">
            <Text className="text-base text-brand-800">Total</Text>
            <Text className="text-3xl font-bold text-brand-900">{formatMoney(totals.total)}</Text>
            <Text className="mt-1 text-sm text-brand-700">
              Subtotal {formatMoney(totals.subtotal)} · GST {formatMoney(totals.tax)}
            </Text>
          </View>
          <PrimaryButton
            label="Save & preview"
            onPress={() => void onSave()}
            isLoading={isLoading}
          />
        </View>
      }
    >
      <View className="gap-5">
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-slate-700">Customer</Text>
            <Text
              className="text-base font-semibold text-brand-700"
              onPress={() => router.push('/(owner)/customer-new')}
            >
              + Add
            </Text>
          </View>
          <CustomerPicker
            customers={customers}
            value={customerId}
            onChange={setCustomerId}
          />
        </View>

        <View className="gap-2">
          <Text className="text-base font-semibold text-slate-700">Items</Text>
          <InvoiceLineItemsEditor items={items} onChange={setItems} />
        </View>

        <View className="gap-2">
          <Text className="text-base font-semibold text-slate-700">GST</Text>
          <GstChips value={gstPercent} onChange={setGstPercent} />
        </View>

        <View>
          <Text className="mb-2 text-base font-semibold text-slate-700">Notes</Text>
          <TextInput
            className="min-h-14 rounded-2xl border border-slate-300 bg-white px-4 text-body-lg"
            placeholder="Optional"
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </View>
    </Screen>
  );
}
