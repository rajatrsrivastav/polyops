import { colors } from '../../components/theme';

export const statusInfo: Record<string, { label: string; fill: string; text: string }> = {
  pending: { label: 'To pack', fill: colors.clay, text: '#744A26' },
  packed: { label: 'Packed', fill: colors.blue, text: '#294F72' },
  shipped: { label: 'Dispatched', fill: '#EDE9F7', text: '#505078' },
  delivered: { label: 'Delivered', fill: colors.wash, text: colors.accent },
  cancelled: { label: 'Cancelled', fill: '#F8E8E6', text: '#7F3A34' },
};
export function orderStatus(value: string) {
  return statusInfo[value] ?? { label: value, fill: colors.paper, text: colors.ink };
}
const dateTime = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
});
export function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? dateTime.format(date) : 'Date unavailable';
}
