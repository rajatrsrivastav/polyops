import { Text, View } from 'react-native';

import { formatDisplayDate, formatTime } from '@/features/attendance/utils/dates';
import { statusLabel, statusTone } from '@/features/attendance/utils/status-label';
import { EmptyState } from '@/shared/components/EmptyState';
import type { Attendance } from '@/shared/types/database';

type AttendanceHistoryListProps = {
  records: Attendance[];
};

export function AttendanceHistoryList({ records }: AttendanceHistoryListProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        title="No history yet"
        description="Your last 30 days of attendance will show here after you mark days."
      />
    );
  }

  return (
    <View className="gap-3">
      <Text className="text-xl font-semibold text-brand-900">Last 30 days</Text>
      {records.map((record) => (
        <View
          key={record.id}
          className={`rounded-2xl border px-4 py-4 ${statusTone(record.status)}`}
        >
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-lg font-semibold">{formatDisplayDate(record.date)}</Text>
            <Text className="text-lg font-bold">{statusLabel(record.status)}</Text>
          </View>
          {(record.check_in || record.check_out) && (
            <Text className="mt-2 text-base opacity-80">
              In {formatTime(record.check_in)} · Out {formatTime(record.check_out)}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
