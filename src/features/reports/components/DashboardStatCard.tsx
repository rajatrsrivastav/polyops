import { Text, View } from 'react-native';

type DashboardStatCardProps = {
  label: string;
  value: string;
  hint?: string;
  emphasize?: boolean;
};

export function DashboardStatCard({
  label,
  value,
  hint,
  emphasize = false,
}: DashboardStatCardProps) {
  return (
    <View
      className={`rounded-2xl px-4 py-4 ${emphasize ? 'bg-brand-700' : 'bg-white'} min-w-[47%] flex-1`}
    >
      <Text
        className={`text-sm font-semibold uppercase tracking-wide ${emphasize ? 'text-brand-100' : 'text-slate-500'}`}
      >
        {label}
      </Text>
      <Text
        className={`mt-2 text-3xl font-bold ${emphasize ? 'text-white' : 'text-brand-900'}`}
      >
        {value}
      </Text>
      {hint ? (
        <Text className={`mt-1 text-sm ${emphasize ? 'text-brand-100' : 'text-slate-500'}`}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
