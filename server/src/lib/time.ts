export const IST = 'Asia/Calcutta';
const offsetMs = 330 * 60 * 1000;
export function istDay(date = new Date()): string {
  return new Date(date.getTime() + offsetMs).toISOString().slice(0, 10);
}
export function dayStart(day: string): Date {
  return new Date(`${day}T00:00:00+05:30`);
}
export function nextDay(day: string): Date {
  return new Date(dayStart(day).getTime() + 86400000);
}
export function dateRange(days: number, now = new Date()) {
  const end = nextDay(istDay(now));
  const start = new Date(end.getTime() - days * 86400000);
  return {
    start,
    end,
    days: Array.from({ length: days }, (_, index) =>
      istDay(new Date(start.getTime() + index * 86400000)),
    ),
  };
}
export function weekKey(now = new Date()) {
  const day = dayStart(istDay(now));
  const weekday = new Date(day.getTime() + offsetMs).getUTCDay();
  return istDay(new Date(day.getTime() - ((weekday + 6) % 7) * 86400000));
}
