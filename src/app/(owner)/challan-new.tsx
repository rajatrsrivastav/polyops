import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { todayIsoDate } from '@/features/attendance/utils/dates';
import { useCreateChallan } from '@/features/challans/hooks/use-challans';
import {
  challanSchema,
  type ChallanItemInput,
} from '@/features/challans/schemas/challan-schema';
import { useCustomers } from '@/features/customers/hooks/use-customers';
import { ChallanLineItemsEditor } from '@/features/documents/components/ChallanLineItemsEditor';
import { CustomerPicker } from '@/features/documents/components/CustomerPicker';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';

export default function ChallanNewScreen() {
  const { customers, isLoading: customersLoading, error: customersError } = useCustomers();
  const { createChallan, isLoading, error: mutationError, reset } = useCreateChallan();

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [items, setItems] = useState<ChallanItemInput[]>([
    { description: '', qty: 1, unit: 'pcs' },
  ]);
  const [vehicleNo, setVehicleNo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId && customers[0]) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  async function onSave() {
    setError(null);
    reset();

    const parsed = challanSchema.safeParse({
      customer_id: customerId,
      challan_date: todayIsoDate(),
      challan_number: '',
      vehicle_no: vehicleNo,
      notes,
      items,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check challan details');
      return;
    }

    try {
      const created = await createChallan(parsed.data);
      router.replace(`/(owner)/challan/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create challan');
    }
  }

  return (
    <Screen
      title="New challan"
      isLoading={customersLoading}
      error={error ?? mutationError ?? customersError}
      footer={
        <PrimaryButton
          label="Save & preview"
          onPress={() => void onSave()}
          isLoading={isLoading}
        />
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
          <ChallanLineItemsEditor items={items} onChange={setItems} />
        </View>

        <View>
          <Text className="mb-2 text-base font-semibold text-slate-700">Vehicle no.</Text>
          <TextInput
            className="min-h-14 rounded-2xl border border-slate-300 bg-white px-4 text-body-lg"
            placeholder="Optional"
            autoCapitalize="characters"
            value={vehicleNo}
            onChangeText={setVehicleNo}
          />
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
