import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from '@/features/expenses/schemas/expense-schema';

type CategoryChipsProps = {
  value: ExpenseCategory | 'All' | null;
  onChange: (value: ExpenseCategory | 'All') => void;
  includeAll?: boolean;
};

export function CategoryChips({ value, onChange, includeAll = false }: CategoryChipsProps) {
  const options: Array<ExpenseCategory | 'All'> = includeAll
    ? ['All', ...EXPENSE_CATEGORIES]
    : [...EXPENSE_CATEGORIES];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="grow-0">
      <View className="flex-row gap-2 pr-2">
        {options.map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              className={`min-h-12 items-center justify-center rounded-2xl px-4 py-3 ${selected ? 'bg-brand-600' : 'bg-white border border-slate-200'}`}
              onPress={() => onChange(option)}
            >
              <Text
                className={`text-base font-semibold ${selected ? 'text-white' : 'text-slate-700'}`}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
