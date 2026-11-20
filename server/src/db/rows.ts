import { randomBytes } from 'node:crypto';
import type { SqlRow } from './pool';
export function newId() {
  return randomBytes(12).toString('hex');
}
export function asString(row: SqlRow, key: string) {
  const value = row[key];
  if (typeof value !== 'string') throw new Error(`Expected text in ${key}`);
  return value;
}
export function asOptionalString(row: SqlRow, key: string) {
  const value = row[key];
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string') throw new Error(`Expected text in ${key}`);
  return value;
}
export function asInt(value: unknown, label: string) {
  if (typeof value === 'bigint') {
    if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER))
      throw new Error(`Integer out of range for ${label}`);
    return Number(value);
  }
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isSafeInteger(number)) throw new Error(`Expected integer for ${label}`);
  return number;
}
export function asRowInt(row: SqlRow, key: string) {
  return asInt(row[key], key);
}
export function asBool(row: SqlRow, key: string) {
  const value = row[key];
  if (typeof value !== 'boolean') throw new Error(`Expected boolean in ${key}`);
  return value;
}
export function asDate(value: unknown, label: string) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  throw new Error(`Expected timestamp for ${label}`);
}
export function asRowDate(row: SqlRow, key: string) {
  return asDate(row[key], key);
}
export function asJson<T>(value: unknown, label: string): T {
  const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value;
  if (parsed === null || parsed === undefined) throw new Error(`Expected JSON for ${label}`);
  return parsed as T;
}
export function likeContains(value: string) {
  return `%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}
