export type DailyReportSummary = {
  date: string;
  expenseTotal: number;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  unmarkedCount: number;
};

export type MonthlyReportSummary = {
  month: string;
  monthLabel: string;
  expenseTotal: number;
  expensesByCategory: Array<{ category: string; total: number }>;
  invoiceTotal: number;
  invoiceCount: number;
  challanCount: number;
  attendance: {
    present: number;
    absent: number;
    halfDay: number;
    totalMarks: number;
  };
  activeEmployeeCount: number;
};

export type RecentInvoiceSummary = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total: number;
};
