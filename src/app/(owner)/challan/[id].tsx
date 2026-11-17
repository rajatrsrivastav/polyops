import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { useChallan } from '@/features/challans/hooks/use-challans';
import { useCustomers } from '@/features/customers/hooks/use-customers';
import { buildChallanHtml } from '@/features/documents/pdf/challan-html';
import { sharePdf } from '@/features/documents/pdf/share-pdf';
import { useFactory } from '@/features/factories/hooks/use-factory';
import { EmptyState } from '@/shared/components/EmptyState';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';

function asId(value: string | string[] | undefined): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return null;
}

export default function ChallanDetailScreen() {
  const challanId = asId(useLocalSearchParams<{ id?: string | string[] }>().id);
  const { challan, isLoading, error, refetch } = useChallan(challanId);
  const { customers } = useCustomers();
  const { factory, isLoading: factoryLoading, error: factoryError } = useFactory();
  const [shareError, setShareError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const customer = useMemo(
    () => customers.find((item) => item.id === challan?.customer_id) ?? null,
    [customers, challan?.customer_id],
  );

  async function onShare() {
    if (!challan || !customer || !factory) {
      setShareError('Challan details are still loading.');
      return;
    }

    setShareError(null);
    setSharing(true);
    try {
      const html = buildChallanHtml({ factory, customer, challan });
      await sharePdf(html, `Share ${challan.challan_number}`);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Could not share PDF');
    } finally {
      setSharing(false);
    }
  }

  if (!challanId) {
    return (
      <Screen title="Challan">
        <EmptyState title="Missing challan" description="Go back and open a challan from the list." />
      </Screen>
    );
  }

  return (
    <Screen
      title="Delivery challan"
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
            disabled={!challan || !customer || !factory}
          />
        </View>
      }
    >
      {!challan ? (
        <EmptyState title="Challan not found" description="It may have been deleted." />
      ) : (
        <View className="gap-4">
          <View className="rounded-2xl bg-brand-700 px-5 py-5">
            <Text className="text-base font-semibold uppercase text-brand-100">
              {challan.challan_number}
            </Text>
            <Text className="mt-2 text-3xl font-bold text-white">{challan.challan_date}</Text>
            {challan.vehicle_no ? (
              <Text className="mt-2 text-base text-brand-100">Vehicle {challan.vehicle_no}</Text>
            ) : null}
          </View>

          <View className="rounded-2xl bg-white px-4 py-4">
            <Text className="text-sm font-semibold uppercase text-slate-500">Deliver to</Text>
            <Text className="mt-1 text-xl font-semibold text-brand-900">
              {customer?.name ?? 'Unknown customer'}
            </Text>
            {customer?.address ? (
              <Text className="mt-1 text-body-lg text-slate-600">{customer.address}</Text>
            ) : null}
          </View>

          <View className="gap-2">
            <Text className="text-xl font-semibold text-brand-900">Items</Text>
            {challan.challan_items.map((item) => (
              <View key={item.id} className="rounded-2xl bg-white px-4 py-4">
                <Text className="text-lg font-semibold text-slate-900">{item.description}</Text>
                <Text className="mt-1 text-body-lg text-slate-600">
                  Qty {item.qty}
                  {item.unit ? ` ${item.unit}` : ''}
                </Text>
              </View>
            ))}
          </View>

          {challan.notes ? (
            <View className="rounded-2xl bg-white px-4 py-4">
              <Text className="text-sm font-semibold uppercase text-slate-500">Notes</Text>
              <Text className="mt-1 text-body-lg text-slate-700">{challan.notes}</Text>
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
