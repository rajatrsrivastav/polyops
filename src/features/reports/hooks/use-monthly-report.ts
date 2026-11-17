import { useMemo } from 'react';

import { useMonthlyAttendance } from '@/features/attendance/hooks/use-attendance';
import { currentMonthLabel, todayIsoDate } from '@/features/attendance/utils/dates';
import { useChallans } from '@/features/challans/hooks/use-challans';
import { useEmployees } from '@/features/employees/hooks/use-employees';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';
import { filterExpenses, sumExpenses } from '@/features/expenses/utils/totals';
import { useInvoices } from '@/features/invoices/hooks/use-invoices';
import type { MonthlyReportSummary } from '@/features/reports/types';

export function useMonthlyReport(referenceDate = new Date()) {
  const today = todayIsoDate();
  const monthKey = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = currentMonthLabel(referenceDate);

  const {
    expenses,
    isLoading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useExpenses();
  const {
    invoices,
    isLoading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useInvoices();
  const {
    challans,
    isLoading: challansLoading,
    error: challansError,
    refetch: refetchChallans,
  } = useChallans();
  const {
    employees,
    isLoading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
  } = useEmployees();
  const {
    isLoading: attendanceLoading,
    error: attendanceError,
    refetch: refetchAttendance,
    summarize,
  } = useMonthlyAttendance(referenceDate);

  const activeEmployeeCount = useMemo(
    () => employees.filter((employee) => employee.is_active).length,
    [employees],
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

  const monthInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.invoice_date.startsWith(monthKey)),
    [invoices, monthKey],
  );

  const monthChallans = useMemo(
    () => challans.filter((challan) => challan.challan_date.startsWith(monthKey)),
    [challans, monthKey],
  );

  const attendanceSummary = summarize(activeEmployeeCount);

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const expense of monthExpenses) {
      map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amount);
    }
    return [...map.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [monthExpenses]);

  const report: MonthlyReportSummary = {
    month: monthKey,
    monthLabel,
    expenseTotal: sumExpenses(monthExpenses),
    expensesByCategory,
    invoiceTotal: monthInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
    invoiceCount: monthInvoices.length,
    challanCount: monthChallans.length,
    attendance: {
      present: attendanceSummary.present,
      absent: attendanceSummary.absent,
      halfDay: attendanceSummary.half_day,
      totalMarks: attendanceSummary.totalMarks,
    },
    activeEmployeeCount,
  };

  const isLoading =
    expensesLoading ||
    invoicesLoading ||
    challansLoading ||
    employeesLoading ||
    attendanceLoading;

  const error =
    expensesError ?? invoicesError ?? challansError ?? employeesError ?? attendanceError;

  function refetch() {
    void refetchExpenses();
    void refetchInvoices();
    void refetchChallans();
    void refetchEmployees();
    void refetchAttendance();
  }

  return {
    report,
    isLoading,
    error,
    refetch,
  };
}
