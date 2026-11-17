import { z } from 'zod';

export const EXPENSE_CATEGORIES = [
  'Raw Material',
  'Labor',
  'Transport',
  'Utility',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const expenseCategorySchema = z.enum(EXPENSE_CATEGORIES);

export const expenseSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  category: expenseCategorySchema,
  description: z.string().trim().max(200, 'Keep the note short').optional().or(z.literal('')),
  /** Local URI before upload, or storage path after save. */
  photo_url: z.string().trim().min(1).optional().nullable(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
