import { z } from 'zod';

export const employeeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  phone: z.string().trim().min(8).max(15).optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
