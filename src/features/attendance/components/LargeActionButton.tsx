import { ActivityIndicator, Pressable, Text } from 'react-native';

type LargeActionButtonProps = {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  tone?: 'primary' | 'success' | 'danger' | 'warning' | 'neutral';
};

const tones: Record<NonNullable<LargeActionButtonProps['tone']>, string> = {
  primary: 'bg-brand-600',
  success: 'bg-emerald-600',
  danger: 'bg-red-600',
  warning: 'bg-amber-500',
  neutral: 'bg-slate-700',
};

export function LargeActionButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  tone = 'primary',
}: LargeActionButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      className={`min-h-20 items-center justify-center rounded-2xl px-5 py-5 active:opacity-80 ${tones[tone]} ${isDisabled ? 'opacity-50' : ''}`}
      disabled={isDisabled}
      onPress={onPress}
    >
      {isLoading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text className="text-center text-2xl font-bold text-white">{label}</Text>
      )}
    </Pressable>
  );
}
