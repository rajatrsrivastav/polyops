import { z } from 'zod';

export const attendanceStatusSchema = z.enum(['present', 'absent', 'half_day']);

const optionalTimestamp = z.string().min(1).nullable().optional();

export const attendanceMarkSchema = z.object({
  employee_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: attendanceStatusSchema,
  check_in: optionalTimestamp,
  check_out: optionalTimestamp,
});

export type AttendanceMarkInput = z.infer<typeof attendanceMarkSchema>;
