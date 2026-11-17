import { z } from 'zod';

export const userRoleSchema = z.enum(['owner', 'employee']);

export const profileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1),
  role: userRoleSchema,
  phone: z.string().nullable(),
  factory_id: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Profile = z.infer<typeof profileSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
