import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useChallans } from '@/features/challans/hooks/use-challans';
import { useCustomers } from '@/features/customers/hooks/use-customers';
import { formatMoney } from '@/features/documents/pdf/escape-html';
import { useInvoices } from '@/features/invoices/hooks/use-invoices';
import { EmptyState } from '@/shared/components/EmptyState';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';
import { SegmentTabs } from '@/shared/components/SegmentTabs';

type DocsTab = 'invoices' | 'challans' | 'customers';

export default function DocumentsScreen() {
  const [tab, setTab] = useState<DocsTab>('invoices');
  const {
    invoices,
    isLoading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useInvoices();
  const {
    challans,
    isLoading: challansLoading,
    error: challansError,
    refetch: refetchChallans,
  } = useChallans();
  const {
    customers,
    isLoading: customersLoading,
    error: customersError,
    refetch: refetchCustomers,
  } = useCustomers();

  const error = invoicesError ?? challansError ?? customersError;
  const isLoading = invoicesLoading || challansLoading || customersLoading;

  function retry() {
    void refetchInvoices();
    void refetchChallans();
    void refetchCustomers();
  }

  return (
    <Screen
      title="Documents"
      isLoading={isLoading}
      error={error}
      footer={
        <View className="gap-3">
          {error ? <PrimaryButton label="Retry" variant="secondary" onPress={retry} /> : null}
          {tab === 'invoices' ? (
            <PrimaryButton label="New invoice" onPress={() => router.push('/(owner)/invoice-new')} />
          ) : null}
          {tab === 'challans' ? (
            <PrimaryButton label="New challan" onPress={() => router.push('/(owner)/challan-new')} />
          ) : null}
          {tab === 'customers' ? (
            <PrimaryButton
              label="Add customer"
              onPress={() => router.push('/(owner)/customer-new')}
            />
          ) : null}
        </View>
      }
    >
      <SegmentTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'invoices', label: 'Invoices' },
          { value: 'challans', label: 'Challans' },
          { value: 'customers', label: 'Customers' },
        ]}
      />

      {tab === 'invoices' ? (
        invoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Create a basic invoice in under a minute — pick customer, add lines, share PDF."
          />
        ) : (
          <View className="gap-3">
            {invoices.map((invoice) => (
              <Pressable
                key={invoice.id}
                className="rounded-2xl bg-white px-4 py-4 active:opacity-80"
                onPress={() => router.push(`/(owner)/invoice/${invoice.id}`)}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-brand-900">
                      {invoice.invoice_number}
                    </Text>
                    <Text className="mt-1 text-body-lg text-slate-600">{invoice.invoice_date}</Text>
                  </View>
                  <Text className="text-xl font-bold text-slate-900">
                    {formatMoney(invoice.total)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      {tab === 'challans' ? (
        challans.length === 0 ? (
          <EmptyState
            title="No delivery challans yet"
            description="Make a challan with customer, items, and optional vehicle number."
          />
        ) : (
          <View className="gap-3">
            {challans.map((challan) => (
              <Pressable
                key={challan.id}
                className="rounded-2xl bg-white px-4 py-4 active:opacity-80"
                onPress={() => router.push(`/(owner)/challan/${challan.id}`)}
              >
                <Text className="text-lg font-semibold text-brand-900">
                  {challan.challan_number}
                </Text>
                <Text className="mt-1 text-body-lg text-slate-600">
                  {challan.challan_date}
                  {challan.vehicle_no ? ` · ${challan.vehicle_no}` : ''}
                </Text>
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      {tab === 'customers' ? (
        customers.length === 0 ? (
          <EmptyState
            title="No customers yet"
            description="Add buyers once — reuse them for every invoice and challan."
          />
        ) : (
          <View className="gap-3">
            {customers.map((customer) => (
              <Pressable
                key={customer.id}
                className="rounded-2xl bg-white px-4 py-4 active:opacity-80"
                onPress={() => router.push(`/(owner)/customer-edit/${customer.id}`)}
              >
                <Text className="text-lg font-semibold text-brand-900">{customer.name}</Text>
                <Text className="mt-1 text-body-lg text-slate-600">
                  {customer.phone ?? 'No phone'}
                  {customer.gstin ? ` · ${customer.gstin}` : ''}
                </Text>
              </Pressable>
            ))}
          </View>
        )
      ) : null}
    </Screen>
  );
}
