import { Pressable, Text, TextInput, View } from 'react-native';

import type { InvoiceItemInput } from '@/features/invoices/schemas/invoice-schema';
import { formatMoney } from '@/features/documents/pdf/escape-html';

type InvoiceLineItemsEditorProps = {
  items: InvoiceItemInput[];
  onChange: (items: InvoiceItemInput[]) => void;
};

export function InvoiceLineItemsEditor({ items, onChange }: InvoiceLineItemsEditorProps) {
  function updateItem(index: number, patch: Partial<InvoiceItemInput>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <View className="gap-3">
      {items.map((item, index) => {
        const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
        return (
          <View key={`item-${index}`} className="rounded-2xl bg-white px-4 py-4">
            <TextInput
              className="min-h-12 rounded-xl border border-slate-200 px-3 text-body-lg text-slate-900"
              placeholder="Description"
              value={item.description}
              onChangeText={(description) => updateItem(index, { description })}
            />
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1">
                <Text className="mb-1 text-sm font-semibold text-slate-500">Qty</Text>
                <TextInput
                  className="min-h-12 rounded-xl border border-slate-200 px-3 text-body-lg"
                  keyboardType="decimal-pad"
                  value={String(item.qty || '')}
                  onChangeText={(qty) => updateItem(index, { qty: Number(qty) || 0 })}
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1 text-sm font-semibold text-slate-500">Rate</Text>
                <TextInput
                  className="min-h-12 rounded-xl border border-slate-200 px-3 text-body-lg"
                  keyboardType="decimal-pad"
                  value={String(item.rate || '')}
                  onChangeText={(rate) => updateItem(index, { rate: Number(rate) || 0 })}
                />
              </View>
              <View className="w-24 justify-end">
                <Text className="mb-1 text-sm font-semibold text-slate-500">Amt</Text>
                <Text className="min-h-12 text-right text-lg font-bold text-slate-900">
                  {formatMoney(amount)}
                </Text>
              </View>
            </View>
            {items.length > 1 ? (
              <Pressable className="mt-3" onPress={() => removeItem(index)}>
                <Text className="text-center text-base font-semibold text-red-600">Remove</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}

      <Pressable
        accessibilityRole="button"
        className="min-h-12 items-center justify-center rounded-2xl border border-brand-600 bg-white px-4 py-3"
        onPress={() => onChange([...items, { description: '', qty: 1, rate: 0 }])}
      >
        <Text className="text-base font-semibold text-brand-700">+ Add line</Text>
      </Pressable>
    </View>
  );
}
