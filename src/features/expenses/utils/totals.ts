import type { ExpenseCategory } from '@/features/expenses/schemas/expense-schema';
import type { Expense } from '@/shared/types/database';

export function isSameLocalDay(isoTimestamp: string, dayIso: string): boolean {
  const date = new Date(isoTimestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` === dayIso;
}

export function isSameLocalMonth(isoTimestamp: string, monthKey: string): boolean {
  const date = new Date(isoTimestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}` === monthKey;
}

export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function filterExpenses(
  expenses: Expense[],
  options: {
    period: 'today' | 'month';
    category: ExpenseCategory | 'All';
    todayIso: string;
    monthKey: string;
  },
): Expense[] {
  return expenses.filter((expense) => {
    const inPeriod =
      options.period === 'today'
        ? isSameLocalDay(expense.created_at, options.todayIso)
        : isSameLocalMonth(expense.created_at, options.monthKey);

    if (!inPeriod) return false;
    if (options.category === 'All') return true;
    return expense.category === options.category;
  });
}

export function formatRupee(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
