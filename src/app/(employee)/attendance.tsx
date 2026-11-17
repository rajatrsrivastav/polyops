import { useState } from 'react';
import { Text, View } from 'react-native';

import { AttendanceHistoryList } from '@/features/attendance/components/AttendanceHistoryList';
import { LargeActionButton } from '@/features/attendance/components/LargeActionButton';
import { StatusBanner } from '@/features/attendance/components/StatusBanner';
import {
  buildCheckInInput,
  buildCheckOutInput,
  useMyAttendance,
  useMyEmployee,
  useUpsertAttendance,
} from '@/features/attendance/hooks/use-attendance';
import { formatDisplayDate, todayIsoDate } from '@/features/attendance/utils/dates';
import { LogoutButton } from '@/features/auth/components/LogoutButton';
import { EmptyState } from '@/shared/components/EmptyState';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';
import { useAuthStore } from '@/shared/store/auth-store';

export default function EmployeeAttendanceScreen() {
  const profile = useAuthStore((state) => state.profile);
  const { employee, isLoading: employeeLoading, error: employeeError, refetch: refetchEmployee } =
    useMyEmployee();
  const {
    attendance,
    todayRecord,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useMyAttendance(employee?.id ?? null);
  const { upsertAttendance, isLoading: saving, error: saveError, reset } = useUpsertAttendance();
  const [actionError, setActionError] = useState<string | null>(null);

  const isLoading = employeeLoading || (Boolean(employee) && historyLoading);
  const error = actionError ?? saveError ?? employeeError ?? historyError;

  async function handleCheckIn() {
    if (!employee) return;
    setActionError(null);
    reset();
    try {
      await upsertAttendance(buildCheckInInput(employee.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not check in');
    }
  }

  async function handleCheckOut() {
    if (!employee) return;
    setActionError(null);
    reset();
    try {
      await upsertAttendance(buildCheckOutInput(employee.id, todayRecord?.check_in ?? null));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not check out');
    }
  }

  function retry() {
    setActionError(null);
    reset();
    void refetchEmployee();
    void refetchHistory();
  }

  const checkedIn = Boolean(todayRecord?.check_in);
  const checkedOut = Boolean(todayRecord?.check_out);
  const canCheckIn = !checkedIn;
  const canCheckOut = checkedIn && !checkedOut;

  return (
    <Screen
      title="My attendance"
      isLoading={isLoading}
      error={error}
      footer={
        <View className="gap-3">
          {error ? (
            <PrimaryButton label="Retry" variant="secondary" onPress={retry} />
          ) : null}
          <LogoutButton />
        </View>
      }
    >
      <Text className="mb-2 text-body-lg text-slate-600">
        Hello{profile?.full_name ? `, ${profile.full_name}` : ''}
      </Text>
      <Text className="mb-5 text-base text-slate-500">{formatDisplayDate(todayIsoDate())}</Text>

      {!employee ? (
        <EmptyState
          title="Account not linked"
          description="Ask the factory owner to link your login to an employee record so you can mark attendance."
        />
      ) : (
        <View className="gap-5">
          <StatusBanner record={todayRecord} />

          <View className="gap-3">
            {canCheckIn ? (
              <LargeActionButton
                label="Check In"
                tone="success"
                isLoading={saving}
                onPress={() => {
                  void handleCheckIn();
                }}
              />
            ) : null}

            {canCheckOut ? (
              <LargeActionButton
                label="Check Out"
                tone="primary"
                isLoading={saving}
                onPress={() => {
                  void handleCheckOut();
                }}
              />
            ) : null}

            {checkedIn && checkedOut ? (
              <View className="rounded-2xl bg-emerald-50 px-4 py-4">
                <Text className="text-center text-xl font-semibold text-emerald-800">
                  Done for today
                </Text>
              </View>
            ) : null}
          </View>

          <AttendanceHistoryList records={attendance} />
        </View>
      )}
    </Screen>
  );
}
