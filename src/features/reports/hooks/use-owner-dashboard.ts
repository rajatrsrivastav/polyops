import { useMemo } from 'react';

import { useAttendance } from '@/features/attendance/hooks/use-attendance';
import { todayIsoDate } from '@/features/attendance/utils/dates';
import { useEmployees } from '@/features/employees/hooks/use-employees';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';
import { filterExpenses, sumExpenses } from '@/features/expenses/utils/totals';
import { useInvoices } from '@/features/invoices/hooks/use-invoices';
import type {
  DailyReportSummary,
  RecentInvoiceSummary,
} from '@/features/reports/types';

export function useOwnerDashboard() {
  const today = todayIsoDate();
  const monthKey = today.slice(0, 7);

  const {
    expenses,
    isLoading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useExpenses();
  const {
    attendance,
    isLoading: attendanceLoading,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useAttendance(today);
  const {
    employees,
    isLoading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
  } = useEmployees();
  const {
    invoices,
    isLoading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useInvoices();

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.is_active),
    [employees],
  );

  const todayExpenses = useMemo(
    () =>
      filterExpenses(expenses, {
        period: 'today',
        category: 'All',
        todayIso: today,
        monthKey,
      }),
    [expenses, today, monthKey],
  );

  const monthExpenses = useMemo(
    () =>
      filterExpenses(expenses, {
        period: 'month',
        category: 'All',
        todayIso: today,
        monthKey,
      }),
    [expenses, today, monthKey],
  );

  const todaySummary: DailyReportSummary = useMemo(() => {
    const presentCount = attendance.filter((row) => row.status === 'present').length;
    const absentCount = attendance.filter((row) => row.status === 'absent').length;
    const halfDayCount = attendance.filter((row) => row.status === 'half_day').length;
    const marked = presentCount + absentCount + halfDayCount;

    return {
      date: today,
      expenseTotal: sumExpenses(todayExpenses),
      presentCount,
      absentCount,
      halfDayCount,
      unmarkedCount: Math.max(activeEmployees.length - marked, 0),
    };
  }, [attendance, today, todayExpenses, activeEmployees.length]);

  const monthExpenseTotal = sumExpenses(monthExpenses);

  const recentInvoices: RecentInvoiceSummary[] = useMemo(
    () =>
      invoices.slice(0, 5).map((invoice) => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        total: invoice.total,
      })),
    [invoices],
  );

  const isLoading =
    expensesLoading || attendanceLoading || employeesLoading || invoicesLoading;
  const error = expensesError ?? attendanceError ?? employeesError ?? invoicesError;

  function refetch() {
    void refetchExpenses();
    void refetchAttendance();
    void refetchEmployees();
    void refetchInvoices();
  }

  return {
    today,
    todaySummary,
    monthExpenseTotal,
    recentInvoices,
    isLoading,
    error,
    refetch,
  };
}
