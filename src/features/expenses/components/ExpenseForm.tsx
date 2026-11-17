import { Text, TextInput, View } from 'react-native';

import { BillPhotoField } from '@/features/expenses/components/BillPhotoField';
import { CategoryChips } from '@/features/expenses/components/CategoryChips';
import type { ExpenseCategory } from '@/features/expenses/schemas/expense-schema';

type ExpenseFormProps = {
  amount: string;
  category: ExpenseCategory;
  description: string;
  storedPhotoPath: string | null;
  localPhotoUri: string | null;
  removeStoredPhoto: boolean;
  onChangeAmount: (value: string) => void;
  onChangeCategory: (value: ExpenseCategory) => void;
  onChangeDescription: (value: string) => void;
  onChangeLocalPhotoUri: (uri: string | null) => void;
  onRemoveStoredPhoto: () => void;
};

export function ExpenseForm({
  amount,
  category,
  description,
  storedPhotoPath,
  localPhotoUri,
  removeStoredPhoto,
  onChangeAmount,
  onChangeCategory,
  onChangeDescription,
  onChangeLocalPhotoUri,
  onRemoveStoredPhoto,
}: ExpenseFormProps) {
  return (
    <View className="gap-5">
      <View>
        <Text className="mb-2 text-base font-semibold text-slate-700">Amount (₹)</Text>
        <TextInput
          autoFocus
          className="min-h-16 rounded-2xl border border-slate-300 bg-white px-4 text-3xl font-bold text-slate-900"
          keyboardType="decimal-pad"
          onChangeText={onChangeAmount}
          placeholder="0"
          value={amount}
        />
      </View>

      <View className="gap-2">
        <Text className="text-base font-semibold text-slate-700">Category</Text>
        <CategoryChips
          value={category}
          onChange={(value) => {
            if (value !== 'All') onChangeCategory(value);
          }}
        />
      </View>

      <View>
        <Text className="mb-2 text-base font-semibold text-slate-700">Short note</Text>
        <TextInput
          className="min-h-14 rounded-2xl border border-slate-300 bg-white px-4 text-body-lg text-slate-900"
          onChangeText={onChangeDescription}
          placeholder="Optional"
          maxLength={200}
          value={description}
        />
      </View>

      <BillPhotoField
        storedPath={storedPhotoPath}
        localUri={localPhotoUri}
        removeStored={removeStoredPhoto}
        onChangeLocalUri={onChangeLocalPhotoUri}
        onRemoveStored={onRemoveStoredPhoto}
      />
    </View>
  );
}
