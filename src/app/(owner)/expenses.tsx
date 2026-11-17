import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { CategoryChips } from '@/features/expenses/components/CategoryChips';
import { ExpenseListItem } from '@/features/expenses/components/ExpenseListItem';
import { ExpenseTotalsCard } from '@/features/expenses/components/ExpenseTotalsCard';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';
import type { ExpenseCategory } from '@/features/expenses/schemas/expense-schema';
import { filterExpenses, sumExpenses } from '@/features/expenses/utils/totals';
import { todayIsoDate } from '@/features/attendance/utils/dates';
import { useTranslation } from '@/i18n';
import { EmptyState } from '@/shared/components/EmptyState';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';
import { SegmentTabs } from '@/shared/components/SegmentTabs';

type Period = 'today' | 'month';

export default function ExpensesScreen() {
  const { t } = useTranslation();
  const { expenses, isLoading, error, refetch } = useExpenses();
  const [period, setPeriod] = useState<Period>('today');
  const [category, setCategory] = useState<ExpenseCategory | 'All'>('All');

  const today = todayIsoDate();
  const monthKey = today.slice(0, 7);

  const filtered = useMemo(
    () =>
      filterExpenses(expenses, {
        period,
        category,
        todayIso: today,
        monthKey,
      }),
    [expenses, period, category, today, monthKey],
  );

  const otherPeriodFiltered = useMemo(
    () =>
      filterExpenses(expenses, {
        period: period === 'today' ? 'month' : 'today',
        category,
        todayIso: today,
        monthKey,
      }),
    [expenses, period, category, today, monthKey],
  );

  const filteredTotal = sumExpenses(filtered);
  const otherTotal = sumExpenses(otherPeriodFiltered);

  return (
    <Screen
      title={t('owner.expenses')}
      isLoading={isLoading}
      error={error}
      footer={
        <View className="gap-3">
          {error ? (
            <PrimaryButton
              label={t('common.retry')}
              variant="secondary"
              onPress={() => void refetch()}
            />
          ) : null}
          <PrimaryButton
            label={t('empty.ctaAddExpense')}
            onPress={() => router.push('/(owner)/expense-new')}
          />
        </View>
      }
    >
      <ExpenseTotalsCard
        periodLabel={period === 'today' ? 'Today total' : 'This month total'}
        periodTotal={filteredTotal}
        otherLabel={period === 'today' ? 'This month' : 'Today'}
        otherTotal={otherTotal}
        filteredCount={filtered.length}
      />

      <SegmentTabs
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'today', label: 'Today' },
          { value: 'month', label: 'This month' },
        ]}
      />

      <View className="mb-4">
        <CategoryChips value={category} includeAll onChange={setCategory} />
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          title={t('empty.noExpensesTitle')}
          description={t('empty.noExpensesBody')}
          actionLabel={t('empty.ctaAddExpense')}
          onAction={() => router.push('/(owner)/expense-new')}
        />
      ) : (
        <View className="gap-3">
          {filtered.map((expense) => (
            <ExpenseListItem
              key={expense.id}
              expense={expense}
              onPress={() => router.push(`/(owner)/expense-edit/${expense.id}`)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
