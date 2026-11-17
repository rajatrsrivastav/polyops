import { todayIsoDate } from '@/features/attendance/utils/dates';
import { getSupabase } from '@/shared/lib/supabase';

function compactToday(): string {
  return todayIsoDate().replaceAll('-', '');
}

async function nextSequentialNumber(
  table: 'invoices' | 'challans',
  numberColumn: 'invoice_number' | 'challan_number',
  factoryId: string,
  prefix: string,
): Promise<string> {
  const { data, error } = await getSupabase()
    .from(table)
    .select(numberColumn)
    .eq('factory_id', factoryId)
    .like(numberColumn, `${prefix}%`);

  if (error) throw new Error(error.message);

  const rows = (data as Record<string, string>[] | null) ?? [];
  const next = rows.length + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

export async function nextInvoiceNumber(factoryId: string): Promise<string> {
  return nextSequentialNumber('invoices', 'invoice_number', factoryId, `INV-${compactToday()}-`);
}

export async function nextChallanNumber(factoryId: string): Promise<string> {
  return nextSequentialNumber('challans', 'challan_number', factoryId, `DC-${compactToday()}-`);
}
