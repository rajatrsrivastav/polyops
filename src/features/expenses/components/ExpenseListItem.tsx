import { Image, Pressable, Text, View } from 'react-native';

import { useBillPhotoUrl } from '@/features/expenses/hooks/use-bill-photo-url';
import { formatRupee } from '@/features/expenses/utils/totals';
import type { Expense } from '@/shared/types/database';

type ExpenseListItemProps = {
  expense: Expense;
  onPress: () => void;
};

export function ExpenseListItem({ expense, onPress }: ExpenseListItemProps) {
  const { url } = useBillPhotoUrl(expense.photo_url);

  return (
    <Pressable
      accessibilityRole="button"
      className="rounded-2xl bg-white px-4 py-4 active:opacity-80"
      onPress={onPress}
    >
      <View className="flex-row items-start gap-3">
        {url ? (
          <Image source={{ uri: url }} className="h-16 w-16 rounded-xl bg-slate-100" />
        ) : (
          <View className="h-16 w-16 items-center justify-center rounded-xl bg-slate-100">
            <Text className="text-xs font-semibold text-slate-400">No photo</Text>
          </View>
        )}

        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-lg font-semibold text-brand-900">{expense.category}</Text>
            <Text className="text-xl font-bold text-slate-900">{formatRupee(expense.amount)}</Text>
          </View>
          {expense.description ? (
            <Text className="mt-1 text-body-lg text-slate-600" numberOfLines={2}>
              {expense.description}
            </Text>
          ) : null}
          <Text className="mt-2 text-sm text-slate-500">
            {new Date(expense.created_at).toLocaleString()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
