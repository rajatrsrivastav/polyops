import type { AttendanceStatus } from '@/shared/types/database';

export function statusLabel(status: AttendanceStatus | null | undefined): string {
  switch (status) {
    case 'present':
      return 'Present';
    case 'absent':
      return 'Absent';
    case 'half_day':
      return 'Half day';
    default:
      return 'Not marked';
  }
}

export function statusTone(status: AttendanceStatus | null | undefined): string {
  switch (status) {
    case 'present':
      return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    case 'absent':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'half_day':
      return 'bg-amber-50 border-amber-200 text-amber-900';
    default:
      return 'bg-slate-50 border-slate-200 text-slate-600';
  }
}
