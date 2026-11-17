import { nextInvoiceNumber } from '@/features/documents/utils/document-numbers';
import type { InvoiceInput } from '@/features/invoices/schemas/invoice-schema';
import { parseNumeric } from '@/shared/lib/parse-numeric';
import { getSupabase } from '@/shared/lib/supabase';
import type { Invoice, InvoiceItem, InvoiceWithItems } from '@/shared/types/database';
import { createClientId } from '@/shared/utils/create-client-id';

type InvoiceRow = Omit<Invoice, 'subtotal' | 'tax' | 'total'> & {
  subtotal: number | string;
  tax: number | string;
  total: number | string;
};

type InvoiceItemRow = Omit<InvoiceItem, 'qty' | 'rate' | 'amount'> & {
  qty: number | string;
  rate: number | string;
  amount: number | string;
};

function mapInvoice(row: InvoiceRow): Invoice {
  return {
    ...row,
    subtotal: parseNumeric(row.subtotal),
    tax: parseNumeric(row.tax),
    total: parseNumeric(row.total),
  };
}

function mapItem(row: InvoiceItemRow): InvoiceItem {
  return {
    ...row,
    qty: parseNumeric(row.qty),
    rate: parseNumeric(row.rate),
    amount: parseNumeric(row.amount),
  };
}

export { nextInvoiceNumber };

export async function listInvoices(factoryId: string): Promise<Invoice[]> {
  const { data, error } = await getSupabase()
    .from('invoices')
    .select('*')
    .eq('factory_id', factoryId)
    .order('invoice_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as InvoiceRow[] | null)?.map(mapInvoice) ?? [];
}

export async function getInvoice(
  factoryId: string,
  invoiceId: string,
): Promise<InvoiceWithItems> {
  const { data, error } = await getSupabase()
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('factory_id', factoryId)
    .eq('id', invoiceId)
    .single();

  if (error) throw new Error(error.message);

  const row = data as InvoiceRow & { invoice_items: InvoiceItemRow[] };
  return {
    ...mapInvoice(row),
    invoice_items: (row.invoice_items ?? []).map(mapItem),
  };
}

export async function createInvoice(params: {
  factoryId: string;
  input: InvoiceInput;
}): Promise<InvoiceWithItems> {
  const items = params.input.items.map((item) => ({
    description: item.description,
    qty: item.qty,
    rate: item.rate,
    amount: Number((item.qty * item.rate).toFixed(2)),
  }));
  const subtotal = Number(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
  const tax = Number((params.input.tax ?? 0).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  const invoiceNumber =
    params.input.invoice_number?.trim() || (await nextInvoiceNumber(params.factoryId));

  const { data: invoice, error } = await getSupabase()
    .from('invoices')
    .insert({
      client_id: createClientId(),
      factory_id: params.factoryId,
      customer_id: params.input.customer_id,
      invoice_number: invoiceNumber,
      invoice_date: params.input.invoice_date,
      tax,
      subtotal,
      total,
      notes: params.input.notes || null,
      status: 'final',
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  const invoiceId = (invoice as InvoiceRow).id;
  const { data: insertedItems, error: itemsError } = await getSupabase()
    .from('invoice_items')
    .insert(items.map((item) => ({ ...item, invoice_id: invoiceId })))
    .select('*');

  if (itemsError) throw new Error(itemsError.message);

  return {
    ...mapInvoice(invoice as InvoiceRow),
    invoice_items: (insertedItems as InvoiceItemRow[]).map(mapItem),
  };
}

export function computeInvoiceTotals(
  items: Array<{ qty: number; rate: number }>,
  taxAmount: number,
): { subtotal: number; tax: number; total: number } {
  const subtotal = Number(
    items.reduce((sum, item) => sum + item.qty * item.rate, 0).toFixed(2),
  );
  const tax = Number(Math.max(taxAmount, 0).toFixed(2));
  return { subtotal, tax, total: Number((subtotal + tax).toFixed(2)) };
}

export function taxFromGstPercent(subtotal: number, gstPercent: number): number {
  return Number(((subtotal * gstPercent) / 100).toFixed(2));
}
