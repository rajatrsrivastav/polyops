import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useCreateCustomer } from '@/features/customers/hooks/use-customers';
import { customerSchema } from '@/features/customers/schemas/customer-schema';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';

export default function CustomerNewScreen() {
  const { createCustomer, isLoading, error: mutationError, reset } = useCreateCustomer();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    setError(null);
    reset();
    const parsed = customerSchema.safeParse({ name, phone, address, gstin });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check customer details');
      return;
    }
    try {
      await createCustomer(parsed.data);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save customer');
    }
  }

  return (
    <Screen
      title="Add customer"
      error={error ?? mutationError}
      footer={<PrimaryButton label="Save" onPress={() => void onSave()} isLoading={isLoading} />}
    >
      <View className="gap-4">
        <Field label="Name" value={name} onChangeText={setName} autoFocus placeholder="Buyer name" />
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
  placeholder,
  keyboardType,
  autoFocus,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
  autoFocus?: boolean;
  autoCapitalize?: 'none' | 'characters';
}) {
  return (
    <View>
      <Text className="mb-2 text-base font-semibold text-slate-700">{label}</Text>
      <TextInput
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        className="min-h-14 rounded-2xl border border-slate-300 bg-white px-4 text-body-lg"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        value={value}
      />
    </View>
  );
}
