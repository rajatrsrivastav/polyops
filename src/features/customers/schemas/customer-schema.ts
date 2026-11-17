import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  phone: z.string().trim().optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  gstin: z.string().trim().optional().or(z.literal('')),
});

export type CustomerInput = z.infer<typeof customerSchema>;
