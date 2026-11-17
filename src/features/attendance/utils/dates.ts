export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfMonthIso(reference = new Date()): string {
  return toIsoDate(new Date(reference.getFullYear(), reference.getMonth(), 1));
}

export function endOfMonthIso(reference = new Date()): string {
  return toIsoDate(new Date(reference.getFullYear(), reference.getMonth() + 1, 0));
}

export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatTime(isoTimestamp: string | null): string {
  if (!isoTimestamp) return '—';
  return new Date(isoTimestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function currentMonthLabel(reference = new Date()): string {
  return reference.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
