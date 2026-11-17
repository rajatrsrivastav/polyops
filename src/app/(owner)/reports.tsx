import { useState } from 'react';
import { Text, View } from 'react-native';

import { sharePdf } from '@/features/documents/pdf/share-pdf';
import { formatMoney } from '@/features/documents/pdf/escape-html';
import { useFactory } from '@/features/factories/hooks/use-factory';
import { DashboardStatCard } from '@/features/reports/components/DashboardStatCard';
import { useMonthlyReport } from '@/features/reports/hooks/use-monthly-report';
import { buildMonthlyReportHtml } from '@/features/reports/pdf/monthly-report-html';
import { formatRupee } from '@/features/expenses/utils/totals';
import { EmptyState } from '@/shared/components/EmptyState';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';

export default function ReportsScreen() {
  const { report, isLoading, error, refetch } = useMonthlyReport();
  const { factory, error: factoryError } = useFactory();
  const [shareError, setShareError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  async function onShare() {
    setShareError(null);
    setSharing(true);
    try {
      const html = buildMonthlyReportHtml({ factory, report });
      await sharePdf(html, `${report.monthLabel} report`);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Could not share report');
    } finally {
      setSharing(false);
    }
  }

  const hasActivity =
    report.expenseTotal > 0 ||
    report.invoiceCount > 0 ||
    report.challanCount > 0 ||
    report.attendance.totalMarks > 0;

  return (
    <Screen
      title="Reports"
      isLoading={isLoading}
      error={shareError ?? error ?? factoryError}
      footer={
        <View className="gap-3">
          {error ? (
            <PrimaryButton label="Retry" variant="secondary" onPress={refetch} />
          ) : null}
          <PrimaryButton
            label="Share / export PDF"
            onPress={() => void onShare()}
            isLoading={sharing}
          />
        </View>
      }
    >
      <Text className="mb-4 text-body-lg text-slate-600">{report.monthLabel}</Text>

      {!hasActivity ? (
        <EmptyState
          title="Nothing to report yet"
          description="Attendance, expenses, invoices, and challans for this month will show here."
        />
      ) : (
        <View className="gap-5">
          <View className="flex-row flex-wrap gap-3">
            <DashboardStatCard
              label="Expenses"
              value={formatRupee(report.expenseTotal)}
              emphasize
            />
            <DashboardStatCard
              label="Invoices"
              value={formatRupee(report.invoiceTotal)}
              hint={`${report.invoiceCount} invoices`}
            />
            <DashboardStatCard
              label="Challans"
              value={String(report.challanCount)}
              hint="Delivery notes"
            />
            <DashboardStatCard
              label="Staff"
              value={String(report.activeEmployeeCount)}
              hint="Active employees"
            />
          </View>

          <View className="rounded-2xl bg-white px-4 py-4">
            <Text className="text-xl font-semibold text-brand-900">Attendance</Text>
            <View className="mt-3 gap-2">
              <ReportRow label="Present marks" value={String(report.attendance.present)} />
              <ReportRow label="Absent marks" value={String(report.attendance.absent)} />
              <ReportRow label="Half-day marks" value={String(report.attendance.halfDay)} />
              <ReportRow label="Total marks" value={String(report.attendance.totalMarks)} bold />
            </View>
          </View>

          <View className="rounded-2xl bg-white px-4 py-4">
            <Text className="text-xl font-semibold text-brand-900">Expenses by category</Text>
            {report.expensesByCategory.length === 0 ? (
              <Text className="mt-3 text-body-lg text-slate-600">No expenses this month</Text>
            ) : (
              <View className="mt-3 gap-2">
                {report.expensesByCategory.map((row) => (
                  <ReportRow
                    key={row.category}
                    label={row.category}
                    value={formatMoney(row.total)}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}

function ReportRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className={`text-body-lg ${bold ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
        {label}
      </Text>
      <Text className={`text-body-lg ${bold ? 'font-bold text-slate-900' : 'text-slate-800'}`}>
        {value}
      </Text>
    </View>
  );
}
