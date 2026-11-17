import { Text, View } from 'react-native';

import { PrimaryButton } from '@/shared/components/PrimaryButton';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center justify-center rounded-2xl bg-white px-6 py-10">
      <Text className="mb-2 text-center text-xl font-semibold text-brand-900">{title}</Text>
      <Text className="text-center text-body-lg text-slate-600">{description}</Text>
      {actionLabel && onAction ? (
        <View className="mt-5 w-full">
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
