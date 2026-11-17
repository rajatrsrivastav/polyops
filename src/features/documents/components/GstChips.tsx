import { Pressable, Text, View } from 'react-native';

const GST_OPTIONS = [0, 5, 12, 18] as const;

type GstChipsProps = {
  value: number;
  onChange: (percent: number) => void;
};

export function GstChips({ value, onChange }: GstChipsProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {GST_OPTIONS.map((percent) => {
        const selected = value === percent;
        return (
          <Pressable
            key={percent}
            accessibilityRole="button"
            className={`min-h-12 min-w-16 items-center justify-center rounded-2xl px-4 py-3 ${selected ? 'bg-brand-600' : 'bg-white border border-slate-200'}`}
            onPress={() => onChange(percent)}
          >
            <Text className={`text-base font-semibold ${selected ? 'text-white' : 'text-slate-700'}`}>
              {percent}%
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
