import { Text, View } from 'react-native';

import { formatTime } from '@/features/attendance/utils/dates';
import { statusLabel, statusTone } from '@/features/attendance/utils/status-label';
import type { Attendance } from '@/shared/types/database';

type StatusBannerProps = {
  record: Attendance | null;
  title?: string;
};

export function StatusBanner({ record, title = 'Today' }: StatusBannerProps) {
  const status = record?.status ?? null;
  const tone = statusTone(status);

  return (
    <View className={`rounded-2xl border px-5 py-5 ${tone}`}>
      <Text className="text-base font-semibold uppercase tracking-wide opacity-80">{title}</Text>
      <Text className="mt-2 text-3xl font-bold">{statusLabel(status)}</Text>
      {record?.status === 'present' || record?.status === 'half_day' ? (
        <Text className="mt-3 text-lg">
          In {formatTime(record.check_in)} · Out {formatTime(record.check_out)}
        </Text>
      ) : null}
    </View>
  );
}
