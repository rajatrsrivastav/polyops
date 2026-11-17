import { z } from 'zod';

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, 'Item description required'),
  qty: z.coerce.number().positive('Qty must be > 0'),
  rate: z.coerce.number().nonnegative('Rate cannot be negative'),
});

export const invoiceSchema = z.object({
  customer_id: z.string().uuid('Select a customer'),
  invoice_number: z.string().trim().min(1).optional().or(z.literal('')),
  invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tax: z.coerce.number().nonnegative().default(0),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  items: z.array(invoiceItemSchema).min(1, 'Add at least one line item'),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
