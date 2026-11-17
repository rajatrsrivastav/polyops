import { Pressable, Text, View } from 'react-native';

import type { Customer } from '@/shared/types/database';

type CustomerPickerProps = {
  customers: Customer[];
  value: string | null;
  onChange: (customerId: string) => void;
};

export function CustomerPicker({ customers, value, onChange }: CustomerPickerProps) {
  if (customers.length === 0) {
    return (
      <View className="rounded-2xl bg-amber-50 px-4 py-4">
        <Text className="text-body-lg text-amber-900">
          Add a customer first — it only takes a name.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {customers.map((customer) => {
        const selected = customer.id === value;
        return (
          <Pressable
            key={customer.id}
            accessibilityRole="button"
            className={`min-h-14 justify-center rounded-2xl px-4 py-3 ${selected ? 'bg-brand-600' : 'bg-white border border-slate-200'}`}
            onPress={() => onChange(customer.id)}
          >
            <Text className={`text-lg font-semibold ${selected ? 'text-white' : 'text-slate-900'}`}>
              {customer.name}
            </Text>
            {customer.phone ? (
              <Text className={`mt-1 ${selected ? 'text-brand-100' : 'text-slate-500'}`}>
                {customer.phone}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
