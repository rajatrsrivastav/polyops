import { type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@/i18n';
import { DashboardSkeleton, ListSkeleton } from '@/shared/components/Skeleton';
import { OfflineBanner } from '@/shared/components/OfflineBanner';

type ScreenProps = {
  title: string;
  children?: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  footer?: ReactNode;
  skeleton?: 'list' | 'dashboard';
};

export function Screen({
  title,
  children,
  isLoading = false,
  error = null,
  footer,
  skeleton = 'list',
}: ScreenProps) {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'left', 'right']}>
      <View className="border-b border-surface-muted px-5 pb-4 pt-2">
        <Text className="text-display text-brand-900">{title}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 px-5 py-5">
          <Text className="mb-4 text-body-lg text-slate-500">{t('common.loading')}</Text>
          {skeleton === 'dashboard' ? <DashboardSkeleton /> : <ListSkeleton />}
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5 py-5"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          <OfflineBanner />
          {error ? (
            <View className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-body-lg text-red-700">{error}</Text>
            </View>
          ) : null}
          {children}
        </ScrollView>
      )}

      {footer ? (
        <View className="border-t border-surface-muted px-5 py-4 pb-5">{footer}</View>
      ) : null}
    </SafeAreaView>
  );
}
