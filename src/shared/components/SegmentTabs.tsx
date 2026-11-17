import { Pressable, Text, View } from 'react-native';

type SegmentTabsProps<T extends string> = {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

export function SegmentTabs<T extends string>({ value, options, onChange }: SegmentTabsProps<T>) {
  return (
    <View className="mb-4 flex-row rounded-2xl bg-slate-200 p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            className={`min-h-12 flex-1 items-center justify-center rounded-xl px-3 py-3 ${selected ? 'bg-white' : ''}`}
            onPress={() => onChange(option.value)}
          >
            <Text
              className={`text-base font-semibold ${selected ? 'text-brand-800' : 'text-slate-600'}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
