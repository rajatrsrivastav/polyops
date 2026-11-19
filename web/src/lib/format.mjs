export function money(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(paise / 100);
}
export function dateTime(iso) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Calcutta',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}
export function retryKey(ref, payload) {
  const serialized = JSON.stringify(payload);
  if (!ref.current || ref.current.payload !== serialized)
    ref.current = { payload: serialized, key: crypto.randomUUID() };
  return ref.current.key;
}
