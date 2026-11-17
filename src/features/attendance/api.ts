import type { AttendanceMarkInput } from '@/features/attendance/schemas/attendance-schema';
import { getSupabase } from '@/shared/lib/supabase';
import type { Attendance, AttendanceStatus, Employee } from '@/shared/types/database';
import { createClientId } from '@/shared/utils/create-client-id';

export async function listAttendanceByDate(
  factoryId: string,
  date: string,
): Promise<Attendance[]> {
  const { data, error } = await getSupabase()
    .from('attendance')
    .select('*')
    .eq('factory_id', factoryId)
    .eq('date', date)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as Attendance[] | null) ?? [];
}

export async function listAttendanceByEmployee(
  factoryId: string,
  employeeId: string,
  limit = 30,
): Promise<Attendance[]> {
  const { data, error } = await getSupabase()
    .from('attendance')
    .select('*')
    .eq('factory_id', factoryId)
    .eq('employee_id', employeeId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as Attendance[] | null) ?? [];
}

export async function listAttendanceInRange(
  factoryId: string,
  startDate: string,
  endDate: string,
): Promise<Attendance[]> {
  const { data, error } = await getSupabase()
    .from('attendance')
    .select('*')
    .eq('factory_id', factoryId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Attendance[] | null) ?? [];
}

export async function findEmployeeByProfileId(
  factoryId: string,
  profileId: string,
): Promise<Employee | null> {
  const { data, error } = await getSupabase()
    .from('employees')
    .select('*')
    .eq('factory_id', factoryId)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Employee | null) ?? null;
}

/**
 * Upsert keeps an existing check_in when the caller omits it (e.g. check-out).
 */
export async function upsertAttendance(params: {
  factoryId: string;
  userId: string;
  input: AttendanceMarkInput;
}): Promise<Attendance> {
  const existing = await getSupabase()
    .from('attendance')
    .select('*')
    .eq('factory_id', params.factoryId)
    .eq('employee_id', params.input.employee_id)
    .eq('date', params.input.date)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);

  const previous = existing.data as Attendance | null;
  const checkIn =
    params.input.check_in !== undefined ? params.input.check_in : (previous?.check_in ?? null);
  const checkOut =
    params.input.check_out !== undefined ? params.input.check_out : (previous?.check_out ?? null);

  const payload = {
    client_id: previous?.client_id ?? createClientId(),
    factory_id: params.factoryId,
    employee_id: params.input.employee_id,
    date: params.input.date,
    status: params.input.status,
    check_in: checkIn,
    check_out: checkOut,
    marked_by: params.userId,
  };

  const { data, error } = await getSupabase()
    .from('attendance')
    .upsert(payload, { onConflict: 'employee_id,date' })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Attendance;
}

export type MonthlyAttendanceSummary = {
  present: number;
  absent: number;
  half_day: number;
  unmarkedActiveEmployees: number;
  totalMarks: number;
};

export function summarizeAttendance(
  records: Attendance[],
  activeEmployeeCount: number,
  daysInMonthSoFar: number,
): MonthlyAttendanceSummary {
  const counts: Record<AttendanceStatus, number> = {
    present: 0,
    absent: 0,
    half_day: 0,
  };

  for (const record of records) {
    counts[record.status] += 1;
  }

  const expectedMarks = activeEmployeeCount * daysInMonthSoFar;
  const totalMarks = records.length;

  return {
    present: counts.present,
    absent: counts.absent,
    half_day: counts.half_day,
    unmarkedActiveEmployees: Math.max(expectedMarks - totalMarks, 0),
    totalMarks,
  };
}
