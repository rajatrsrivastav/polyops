export function money(paise: number): string;
export function dateTime(iso: string): string;
export function retryKey(
  ref: { current: { payload: string; key: string } | null },
  payload: unknown,
): string;
