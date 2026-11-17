import { escapeHtml, formatMoney } from '@/features/documents/pdf/escape-html';
import type { MonthlyReportSummary } from '@/features/reports/types';
import type { Factory } from '@/shared/types/database';

export function buildMonthlyReportHtml(params: {
  factory: Factory | null;
  report: MonthlyReportSummary;
}): string {
  const { factory, report } = params;
  const categoryRows =
    report.expensesByCategory.length === 0
      ? `<tr><td colspan="2" class="muted">No expenses this month</td></tr>`
      : report.expensesByCategory
          .map(
            (row) => `
        <tr>
          <td>${escapeHtml(row.category)}</td>
          <td class="num">${formatMoney(row.total)}</td>
        </tr>`,
          )
          .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0f172a; padding: 28px; font-size: 13px; }
    h1 { margin: 0 0 4px; font-size: 24px; color: #1e3a5f; }
    h2 { margin: 28px 0 10px; font-size: 16px; color: #1e3a5f; }
    .muted { color: #64748b; }
    .grid { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 18px; }
    .card { width: 47%; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }
    .value { margin-top: 6px; font-size: 22px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 6px; text-align: left; }
    th { background: #f8fafc; font-size: 11px; text-transform: uppercase; }
    .num { text-align: right; white-space: nowrap; }
  </style>
</head>
<body>
  <h1>${escapeHtml(factory?.name ?? 'FactoryEase')} — Monthly Report</h1>
  <div class="muted">${escapeHtml(report.monthLabel)}</div>
  ${factory?.address ? `<div class="muted">${escapeHtml(factory.address)}</div>` : ''}

  <div class="grid">
    <div class="card">
      <div class="label">Expenses</div>
      <div class="value">${formatMoney(report.expenseTotal)}</div>
    </div>
    <div class="card">
      <div class="label">Invoice totals</div>
      <div class="value">${formatMoney(report.invoiceTotal)}</div>
    </div>
    <div class="card">
      <div class="label">Invoices</div>
      <div class="value">${report.invoiceCount}</div>
    </div>
    <div class="card">
      <div class="label">Challans</div>
      <div class="value">${report.challanCount}</div>
    </div>
  </div>

  <h2>Attendance</h2>
  <div class="muted">${report.activeEmployeeCount} active employees</div>
  <table>
    <thead>
      <tr><th>Status</th><th class="num">Marks</th></tr>
    </thead>
    <tbody>
      <tr><td>Present</td><td class="num">${report.attendance.present}</td></tr>
      <tr><td>Absent</td><td class="num">${report.attendance.absent}</td></tr>
      <tr><td>Half day</td><td class="num">${report.attendance.halfDay}</td></tr>
      <tr><td>Total marks</td><td class="num">${report.attendance.totalMarks}</td></tr>
    </tbody>
  </table>

  <h2>Expenses by category</h2>
  <table>
    <thead>
      <tr><th>Category</th><th class="num">Total</th></tr>
    </thead>
    <tbody>${categoryRows}</tbody>
  </table>
</body>
</html>`;
}
