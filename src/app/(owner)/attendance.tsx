import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { MonthlySummaryCard } from '@/features/attendance/components/MonthlySummaryCard';
import { OwnerAttendanceRow } from '@/features/attendance/components/OwnerAttendanceRow';
import { SegmentTabs } from '@/shared/components/SegmentTabs';
import {
  buildStatusMarkInput,
  useAttendance,
  useMonthlyAttendance,
  useUpsertAttendance,
} from '@/features/attendance/hooks/use-attendance';
import { formatDisplayDate, todayIsoDate } from '@/features/attendance/utils/dates';
import { useEmployees } from '@/features/employees/hooks/use-employees';
import { useTranslation } from '@/i18n';
import { EmptyState } from '@/shared/components/EmptyState';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';
import type { AttendanceStatus } from '@/shared/types/database';
import { router } from 'expo-router';

type OwnerTab = 'today' | 'month';

export default function OwnerAttendanceScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<OwnerTab>('today');
  const [actionError, setActionError] = useState<string | null>(null);
  const date = todayIsoDate();

  const {
    employees,
    isLoading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
  } = useEmployees();
  const {
    attendance,
    isLoading: attendanceLoading,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useAttendance(date);
  const {
    isLoading: monthLoading,
    error: monthError,
    refetch: refetchMonth,
    summarize,
  } = useMonthlyAttendance();
  const {
    upsertAttendance,
    isLoading: saving,
    error: saveError,
    reset,
    variables,
  } = useUpsertAttendance();

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.is_active),
    [employees],
  );

  const summary = summarize(activeEmployees.length);

  const presentCount = attendance.filter((row) => row.status === 'present').length;
  const absentCount = attendance.filter((row) => row.status === 'absent').length;
  const halfDayCount = attendance.filter((row) => row.status === 'half_day').length;
  const unmarkedCount = Math.max(activeEmployees.length - attendance.length, 0);

  const isLoading =
    employeesLoading || (tab === 'today' ? attendanceLoading : monthLoading);
  const error = actionError ?? saveError ?? employeesError ?? attendanceError ?? monthError;

  async function markEmployee(employeeId: string, status: AttendanceStatus) {
    setActionError(null);
    reset();
    const existing = attendance.find((row) => row.employee_id === employeeId) ?? null;
    try {
      await upsertAttendance(buildStatusMarkInput(employeeId, status, date, existing));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update attendance');
    }
  }

  function retry() {
    setActionError(null);
    reset();
    void refetchEmployees();
    void refetchAttendance();
    void refetchMonth();
  }

  return (
    <Screen
      title={t('owner.attendance')}
      isLoading={isLoading}
      error={error}
      footer={
        error ? (
          <PrimaryButton label={t('common.retry')} variant="secondary" onPress={retry} />
        ) : null
      }
    >
      <SegmentTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'today', label: 'Today' },
          { value: 'month', label: 'This month' },
        ]}
      />

      {tab === 'month' ? (
        <View className="gap-4">
          <MonthlySummaryCard summary={summary} />
          {summary.totalMarks === 0 ? (
            <EmptyState
              title="No marks this month"
              description="When you mark attendance, the monthly totals will appear here."
            />
          ) : null}
        </View>
      ) : (
        <View className="gap-4">
          <Text className="text-body-lg text-slate-600">{formatDisplayDate(date)}</Text>

          <View className="flex-row gap-2">
            <StatChip label="Present" value={presentCount} />
            <StatChip label="Absent" value={absentCount} />
            <StatChip label="Half" value={halfDayCount} />
            <StatChip label="Open" value={unmarkedCount} />
          </View>

          {activeEmployees.length === 0 ? (
            <EmptyState
              title={t('empty.noAttendanceTitle')}
              description={t('empty.noAttendanceBody')}
              actionLabel={t('empty.ctaAddEmployee')}
              onAction={() => router.push('/(owner)/employees')}
            />
          ) : (
            <View className="gap-4">
              {activeEmployees.map((employee) => {
                const record =
                  attendance.find((row) => row.employee_id === employee.id) ?? null;
                const isSavingThis =
                  saving && variables?.employee_id === employee.id;

                return (
                  <OwnerAttendanceRow
                    key={employee.id}
                    employee={employee}
                    record={record}
                    isSaving={Boolean(isSavingThis)}
                    onMark={(status) => {
                      void markEmployee(employee.id, status);
                    }}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <View className="min-w-[22%] flex-1 rounded-xl bg-white px-2 py-3">
      <Text className="text-center text-xs font-semibold uppercase text-slate-500">{label}</Text>
      <Text className="mt-1 text-center text-2xl font-bold text-brand-900">{value}</Text>
    </View>
  );
}
