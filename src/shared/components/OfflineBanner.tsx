import { Text, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { useNetworkStatus } from '@/shared/hooks/use-network-status';
import { useOfflineQueueStore } from '@/shared/store/offline-queue-store';

export function OfflineBanner() {
  const { t } = useTranslation();
  const { isOnline } = useNetworkStatus();
  const pendingCount = useOfflineQueueStore((state) => state.items.length);
  const isFlushing = useOfflineQueueStore((state) => state.isFlushing);

  if (isOnline && pendingCount === 0 && !isFlushing) {
    return null;
  }

  const message = !isOnline
    ? t('common.offline')
    : isFlushing
      ? t('common.syncing')
      : t('common.pendingSync', { count: pendingCount });

  return (
    <View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <Text className="text-center text-body-lg font-semibold text-amber-950">{message}</Text>
    </View>
  );
}
