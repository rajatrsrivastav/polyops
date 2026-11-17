import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  findEmployeeByProfileId,
  listAttendanceByDate,
  listAttendanceByEmployee,
  listAttendanceInRange,
  summarizeAttendance,
  upsertAttendance,
} from '@/features/attendance/api';
import type { AttendanceMarkInput } from '@/features/attendance/schemas/attendance-schema';
import { endOfMonthIso, startOfMonthIso, todayIsoDate } from '@/features/attendance/utils/dates';
import { translate } from '@/i18n';
import {
  requireFactoryId,
  requireUserId,
  useFactoryContext,
} from '@/shared/hooks/use-factory-context';
import { queryKeys } from '@/shared/lib/query-keys';
import { useLocaleStore } from '@/shared/store/locale-store';
import { getIsOnline } from '@/shared/store/network-store';
import { useOfflineQueueStore } from '@/shared/store/offline-queue-store';
import { toast } from '@/shared/store/toast-store';
import type { Attendance } from '@/shared/types/database';
import { createClientId } from '@/shared/utils/create-client-id';

export function useAttendance(date: string) {
  const { factoryId } = useFactoryContext();
  const enabled = Boolean(factoryId && date);

  const query = useQuery({
    queryKey: queryKeys.attendance.byDate(factoryId ?? 'none', date),
    queryFn: () => listAttendanceByDate(requireFactoryId(factoryId), date),
    enabled,
  });

  return {
    attendance: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useMyEmployee() {
  const { factoryId, userId } = useFactoryContext();
  const enabled = Boolean(factoryId && userId);

  const query = useQuery({
    queryKey: ['employees', factoryId ?? 'none', 'by-profile', userId ?? 'none'] as const,
    queryFn: () =>
      findEmployeeByProfileId(requireFactoryId(factoryId), requireUserId(userId)),
    enabled,
  });

  return {
    employee: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useMyAttendance(employeeId: string | null) {
  const { factoryId } = useFactoryContext();
  const enabled = Boolean(factoryId && employeeId);

  const query = useQuery({
    queryKey: queryKeys.attendance.byEmployee(factoryId ?? 'none', employeeId ?? 'none'),
    queryFn: () =>
      listAttendanceByEmployee(requireFactoryId(factoryId), employeeId as string, 30),
    enabled,
  });

  const today = todayIsoDate();
  const todayRecord = (query.data ?? []).find((row) => row.date === today) ?? null;

  return {
    attendance: query.data ?? [],
    todayRecord,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useMonthlyAttendance(referenceDate = new Date()) {
  const { factoryId } = useFactoryContext();
  const start = startOfMonthIso(referenceDate);
  const end = endOfMonthIso(referenceDate);
  const monthKey = start.slice(0, 7);
  const enabled = Boolean(factoryId);

  const query = useQuery({
    queryKey: queryKeys.attendance.byMonth(factoryId ?? 'none', monthKey),
    queryFn: () => listAttendanceInRange(requireFactoryId(factoryId), start, end),
    enabled,
  });

  const today = todayIsoDate();
  const daysInMonthSoFar = Math.min(
    Number(today.slice(8, 10)),
    Number(end.slice(8, 10)),
  );

  return {
    records: query.data ?? [],
    monthKey,
    daysInMonthSoFar,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
    summarize: (activeEmployeeCount: number) =>
      summarizeAttendance(query.data ?? [], activeEmployeeCount, daysInMonthSoFar),
  };
}

export function useUpsertAttendance() {
  const queryClient = useQueryClient();
  const { factoryId, userId } = useFactoryContext();

  const mutation = useMutation({
    mutationFn: async (input: AttendanceMarkInput) => {
      const fid = requireFactoryId(factoryId);
      const uid = requireUserId(userId);

      if (!getIsOnline()) {
        const queueId = createClientId();
        useOfflineQueueStore.getState().enqueue({
          id: queueId,
          type: 'attendance.upsert',
          payload: {
            factoryId: fid,
            userId: uid,
            input,
          },
        });
        toast.info(translate(useLocaleStore.getState().locale, 'common.offlineQueued'));
        return {
          id: `temp_${queueId}`,
          client_id: queueId,
          factory_id: fid,
          employee_id: input.employee_id,
          date: input.date,
          status: input.status,
          check_in: input.check_in ?? null,
          check_out: input.check_out ?? null,
          marked_by: uid,
          created_at: new Date().toISOString(),
        } satisfies Attendance;
      }

      return upsertAttendance({
        factoryId: fid,
        userId: uid,
        input,
      });
    },
    onMutate: async (input) => {
      const fid = requireFactoryId(factoryId);
      const uid = requireUserId(userId);
      const dayKey = queryKeys.attendance.byDate(fid, input.date);
      const employeeKey = queryKeys.attendance.byEmployee(fid, input.employee_id);
      const monthKey = queryKeys.attendance.byMonth(fid, input.date.slice(0, 7));

      await Promise.all([
        queryClient.cancelQueries({ queryKey: dayKey }),
        queryClient.cancelQueries({ queryKey: employeeKey }),
        queryClient.cancelQueries({ queryKey: monthKey }),
      ]);

      const previousDay = queryClient.getQueryData<Attendance[]>(dayKey) ?? [];
      const previousEmployee = queryClient.getQueryData<Attendance[]>(employeeKey) ?? [];
      const previousMonth = queryClient.getQueryData<Attendance[]>(monthKey) ?? [];

      const existing =
        previousDay.find((row) => row.employee_id === input.employee_id) ??
        previousEmployee.find((row) => row.date === input.date) ??
        null;

      const optimistic: Attendance = {
        id: existing?.id ?? `temp_${createClientId()}`,
        client_id: existing?.client_id ?? createClientId(),
        factory_id: fid,
        employee_id: input.employee_id,
        date: input.date,
        status: input.status,
        check_in:
          input.check_in !== undefined ? input.check_in : (existing?.check_in ?? null),
        check_out:
          input.check_out !== undefined ? input.check_out : (existing?.check_out ?? null),
        marked_by: uid,
        created_at: existing?.created_at ?? new Date().toISOString(),
      };

      queryClient.setQueryData<Attendance[]>(dayKey, [
        ...previousDay.filter((row) => row.employee_id !== input.employee_id),
        optimistic,
      ]);

      queryClient.setQueryData<Attendance[]>(employeeKey, [
        optimistic,
        ...previousEmployee.filter((row) => row.date !== input.date),
      ]);

      queryClient.setQueryData<Attendance[]>(monthKey, [
        optimistic,
        ...previousMonth.filter(
          (row) => !(row.employee_id === input.employee_id && row.date === input.date),
        ),
      ]);

      return { previousDay, previousEmployee, previousMonth, dayKey, employeeKey, monthKey };
    },
    onError: (err, _input, context) => {
      if (!context) return;
      queryClient.setQueryData(context.dayKey, context.previousDay);
      queryClient.setQueryData(context.employeeKey, context.previousEmployee);
      queryClient.setQueryData(context.monthKey, context.previousMonth);
      toast.error(err instanceof Error ? err.message : 'Could not update attendance');
    },
    onSettled: (_data, _err, variables, context) => {
      if (!getIsOnline()) return;
      if (context) {
        void queryClient.invalidateQueries({ queryKey: context.dayKey });
        void queryClient.invalidateQueries({ queryKey: context.employeeKey });
        void queryClient.invalidateQueries({ queryKey: context.monthKey });
      } else if (factoryId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.attendance.byDate(factoryId, variables.date),
        });
      }
    },
  });

  return {
    upsertAttendance: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
    variables: mutation.variables,
  };
}

/** Convenience helpers for employee check-in / check-out. */
export function buildCheckInInput(employeeId: string): AttendanceMarkInput {
  return {
    employee_id: employeeId,
    date: todayIsoDate(),
    status: 'present',
    check_in: new Date().toISOString(),
    check_out: null,
  };
}

export function buildCheckOutInput(
  employeeId: string,
  existingCheckIn: string | null,
): AttendanceMarkInput {
  return {
    employee_id: employeeId,
    date: todayIsoDate(),
    status: 'present',
    check_in: existingCheckIn,
    check_out: new Date().toISOString(),
  };
}

export function buildStatusMarkInput(
  employeeId: string,
  status: AttendanceMarkInput['status'],
  date = todayIsoDate(),
  existing?: Pick<Attendance, 'check_in' | 'check_out'> | null,
): AttendanceMarkInput {
  if (status === 'absent') {
    return {
      employee_id: employeeId,
      date,
      status,
      check_in: null,
      check_out: null,
    };
  }

  return {
    employee_id: employeeId,
    date,
    status,
    check_in: existing?.check_in ?? new Date().toISOString(),
    check_out: existing?.check_out ?? null,
  };
}
