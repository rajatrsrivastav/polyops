import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useCustomer, useUpdateCustomer } from '@/features/customers/hooks/use-customers';
import { customerSchema } from '@/features/customers/schemas/customer-schema';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';

function asId(value: string | string[] | undefined): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return null;
}

export default function CustomerEditScreen() {
  const customerId = asId(useLocalSearchParams<{ id?: string | string[] }>().id);
  const { customer, isLoading, error: loadError } = useCustomer(customerId);
  const { updateCustomer, isLoading: saving, error: saveError, reset } = useUpdateCustomer();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!customer || hydrated) return;
    setName(customer.name);
    setPhone(customer.phone ?? '');
    setAddress(customer.address ?? '');
    setGstin(customer.gstin ?? '');
    setHydrated(true);
  }, [customer, hydrated]);

  async function onSave() {
    if (!customerId) return;
    setError(null);
    reset();
    const parsed = customerSchema.safeParse({ name, phone, address, gstin });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check customer details');
      return;
    }
    try {
      await updateCustomer({ customerId, input: parsed.data });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update customer');
    }
  }

  return (
    <Screen
      title="Edit customer"
      isLoading={isLoading || !hydrated}
      error={error ?? loadError ?? saveError}
      footer={<PrimaryButton label="Save" onPress={() => void onSave()} isLoading={saving} />}
    >
      <View className="gap-4">
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Address" value={address} onChangeText={setAddress} />
        <Field label="GSTIN" value={gstin} onChangeText={setGstin} autoCapitalize="characters" />
      </View>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'phone-pad';
  autoCapitalize?: 'none' | 'characters';
}) {
  return (
    <View>
      <Text className="mb-2 text-base font-semibold text-slate-700">{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        className="min-h-14 rounded-2xl border border-slate-300 bg-white px-4 text-body-lg"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        value={value}
      />
    </View>
  );
}
