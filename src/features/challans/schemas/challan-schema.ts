import { z } from 'zod';

export const challanItemSchema = z.object({
  description: z.string().trim().min(1, 'Item description required'),
  qty: z.coerce.number().positive('Qty must be > 0'),
  unit: z.string().trim().optional().or(z.literal('')),
});

export const challanSchema = z.object({
  customer_id: z.string().uuid('Select a customer'),
  challan_number: z.string().trim().min(1).optional().or(z.literal('')),
  challan_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vehicle_no: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  items: z.array(challanItemSchema).min(1, 'Add at least one line item'),
});

export type ChallanInput = z.infer<typeof challanSchema>;
export type ChallanItemInput = z.infer<typeof challanItemSchema>;
