import { Text, View } from 'react-native';

import { LargeActionButton } from '@/features/attendance/components/LargeActionButton';
import { formatTime } from '@/features/attendance/utils/dates';
import { statusLabel, statusTone } from '@/features/attendance/utils/status-label';
import type { Attendance, AttendanceStatus, Employee } from '@/shared/types/database';

type OwnerAttendanceRowProps = {
  employee: Employee;
  record: Attendance | null;
  isSaving: boolean;
  onMark: (status: AttendanceStatus) => void;
};

export function OwnerAttendanceRow({
  employee,
  record,
  isSaving,
  onMark,
}: OwnerAttendanceRowProps) {
  return (
    <View className="rounded-2xl bg-white px-4 py-4">
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xl font-bold text-brand-900">{employee.name}</Text>
          {record?.check_in || record?.check_out ? (
            <Text className="mt-1 text-base text-slate-600">
              In {formatTime(record.check_in)} · Out {formatTime(record.check_out)}
            </Text>
          ) : null}
        </View>
        <View className={`rounded-xl border px-3 py-2 ${statusTone(record?.status)}`}>
          <Text className="text-base font-semibold">{statusLabel(record?.status)}</Text>
        </View>
      </View>

      <View className="gap-2">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <LargeActionButton
              label="Present"
              tone="success"
              isLoading={isSaving}
              onPress={() => onMark('present')}
            />
          </View>
          <View className="flex-1">
            <LargeActionButton
              label="Absent"
              tone="danger"
              isLoading={isSaving}
              onPress={() => onMark('absent')}
            />
          </View>
        </View>
        <LargeActionButton
          label="Half day"
          tone="warning"
          isLoading={isSaving}
          onPress={() => onMark('half_day')}
        />
      </View>
    </View>
  );
}
