import { ActivityIndicator, Pressable, Text } from 'react-native';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

export function PrimaryButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
}: PrimaryButtonProps) {
  const isDisabled = disabled || isLoading;
  const base =
    'min-h-14 items-center justify-center rounded-2xl px-5 py-4 active:opacity-80';
  const tones =
    variant === 'primary'
      ? 'bg-brand-600'
      : 'border border-brand-600 bg-white';
  const labelTone = variant === 'primary' ? 'text-white' : 'text-brand-700';

  return (
    <Pressable
      accessibilityRole="button"
      className={`${base} ${tones} ${isDisabled ? 'opacity-50' : ''}`}
      disabled={isDisabled}
      onPress={onPress}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#1d4ed8'} />
      ) : (
        <Text className={`text-body-lg font-semibold ${labelTone}`}>{label}</Text>
      )}
    </Pressable>
  );
}
