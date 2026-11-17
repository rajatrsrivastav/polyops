import { Text, View } from 'react-native';

import { formatRupee } from '@/features/expenses/utils/totals';

type ExpenseTotalsCardProps = {
  periodLabel: string;
  periodTotal: number;
  otherLabel: string;
  otherTotal: number;
  filteredCount: number;
};

export function ExpenseTotalsCard({
  periodLabel,
  periodTotal,
  otherLabel,
  otherTotal,
  filteredCount,
}: ExpenseTotalsCardProps) {
  return (
    <View className="mb-4 rounded-2xl bg-brand-700 px-5 py-5">
      <Text className="text-base font-semibold uppercase tracking-wide text-brand-100">
        {periodLabel}
      </Text>
      <Text className="mt-2 text-4xl font-bold text-white">{formatRupee(periodTotal)}</Text>
      <View className="mt-4 flex-row items-end justify-between gap-3">
        <View>
          <Text className="text-sm font-semibold uppercase text-brand-100">{otherLabel}</Text>
          <Text className="mt-1 text-xl font-bold text-white">{formatRupee(otherTotal)}</Text>
        </View>
        <Text className="text-base text-brand-100">
          {filteredCount} {filteredCount === 1 ? 'entry' : 'entries'}
        </Text>
      </View>
    </View>
  );
}
