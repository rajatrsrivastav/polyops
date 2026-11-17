import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { formatDisplayDate } from '@/features/attendance/utils/dates';
import { LogoutButton } from '@/features/auth/components/LogoutButton';
import { formatMoney } from '@/features/documents/pdf/escape-html';
import { formatRupee } from '@/features/expenses/utils/totals';
import { useTranslation } from '@/i18n';
import { DashboardStatCard } from '@/features/reports/components/DashboardStatCard';
import { QuickActionGrid } from '@/features/reports/components/QuickActionGrid';
import { useOwnerDashboard } from '@/features/reports/hooks/use-owner-dashboard';
import { EmptyState } from '@/shared/components/EmptyState';
import { LanguageToggle } from '@/shared/components/LanguageToggle';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';
import { useAuthStore } from '@/shared/store/auth-store';

export default function OwnerHomeScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((state) => state.profile);
  const {
    today,
    todaySummary,
    monthExpenseTotal,
    recentInvoices,
    isLoading,
    error,
    refetch,
  } = useOwnerDashboard();

  return (
    <Screen
      title={t('owner.home')}
      isLoading={isLoading}
      error={error}
      skeleton="dashboard"
      footer={
        <View className="gap-3">
          {error ? (
            <PrimaryButton label={t('common.retry')} variant="secondary" onPress={refetch} />
          ) : null}
          <LanguageToggle />
          <LogoutButton />
        </View>
      }
    >
      <Text className="mb-1 text-body-lg text-slate-600">
        {t('owner.greeting')}
        {profile?.full_name ? `, ${profile.full_name}` : ''}
      </Text>
      <Text className="mb-4 text-base text-slate-500">{formatDisplayDate(today)}</Text>

      <View className="mb-4 gap-3">
        <Text className="text-xl font-semibold text-brand-900">{t('owner.attendanceToday')}</Text>
        <View className="flex-row flex-wrap gap-3">
          <DashboardStatCard
            label="Present"
            value={String(todaySummary.presentCount)}
            hint={`${todaySummary.unmarkedCount} unmarked`}
            emphasize
          />
          <DashboardStatCard label="Absent" value={String(todaySummary.absentCount)} />
          <DashboardStatCard label="Half day" value={String(todaySummary.halfDayCount)} />
        </View>
      </View>

      <View className="mb-5 flex-row gap-3">
        <DashboardStatCard
          label={t('owner.expensesToday')}
          value={formatRupee(todaySummary.expenseTotal)}
        />
        <DashboardStatCard
          label={t('owner.thisMonth')}
          value={formatRupee(monthExpenseTotal)}
        />
      </View>

      <View className="mb-6">
        <QuickActionGrid />
      </View>

      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-brand-900">{t('owner.recentInvoices')}</Text>
        <Pressable
          className="min-h-11 justify-center px-2"
          onPress={() => router.push('/(owner)/documents')}
        >
          <Text className="text-base font-semibold text-brand-700">{t('common.seeAll')}</Text>
        </Pressable>
      </View>

      {recentInvoices.length === 0 ? (
        <EmptyState
          title={t('empty.noInvoicesTitle')}
          description={t('empty.noInvoicesBody')}
          actionLabel={t('empty.ctaNewInvoice')}
          onAction={() => router.push('/(owner)/invoice-new')}
        />
      ) : (
        <View className="gap-3">
          {recentInvoices.map((invoice) => (
            <Pressable
              key={invoice.id}
              className="min-h-16 rounded-2xl bg-white px-4 py-4 active:opacity-80"
              onPress={() => router.push(`/(owner)/invoice/${invoice.id}`)}
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-brand-900">
                    {invoice.invoice_number}
                  </Text>
                  <Text className="mt-1 text-body-lg text-slate-600">{invoice.invoice_date}</Text>
                </View>
                <Text className="text-xl font-bold text-slate-900">
                  {formatMoney(invoice.total)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        className="mt-6 min-h-12 items-center justify-center"
        onPress={() => router.push('/(owner)/reports')}
      >
        <Text className="text-center text-body-lg font-semibold text-brand-700">
          {t('owner.openMonthlyReport')}
        </Text>
      </Pressable>
    </Screen>
  );
}
