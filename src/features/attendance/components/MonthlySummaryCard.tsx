import { Text, View } from 'react-native';

import type { MonthlyAttendanceSummary } from '@/features/attendance/api';
import { currentMonthLabel } from '@/features/attendance/utils/dates';

type MonthlySummaryCardProps = {
  summary: MonthlyAttendanceSummary;
};

export function MonthlySummaryCard({ summary }: MonthlySummaryCardProps) {
  return (
    <View className="rounded-2xl bg-white px-5 py-5">
      <Text className="text-base font-semibold uppercase tracking-wide text-slate-500">
        {currentMonthLabel()}
      </Text>
      <Text className="mt-2 text-2xl font-bold text-brand-900">Monthly summary</Text>

      <View className="mt-4 flex-row flex-wrap gap-3">
        <SummaryChip label="Present" value={summary.present} tone="bg-emerald-50 text-emerald-800" />
        <SummaryChip label="Absent" value={summary.absent} tone="bg-red-50 text-red-800" />
        <SummaryChip label="Half day" value={summary.half_day} tone="bg-amber-50 text-amber-900" />
      </View>

      <Text className="mt-4 text-body-lg text-slate-600">
        {summary.totalMarks} marked · {summary.unmarkedActiveEmployees} unmarked slots so far
      </Text>
    </View>
  );
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <View className={`min-w-[30%] flex-1 rounded-xl px-4 py-3 ${tone}`}>
      <Text className="text-sm font-semibold uppercase opacity-80">{label}</Text>
      <Text className="mt-1 text-3xl font-bold">{value}</Text>
    </View>
  );
}
