import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore } from '@/shared/store/toast-store';

const tones = {
  info: 'bg-slate-900',
  success: 'bg-emerald-700',
  error: 'bg-red-700',
} as const;

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-50 px-4"
      style={{ top: insets.top + 8 }}
    >
      <View className="gap-2">
        {toasts.map((toast) => (
          <Pressable
            key={toast.id}
            accessibilityRole="button"
            className={`rounded-2xl px-4 py-3 ${tones[toast.tone]}`}
            onPress={() => dismiss(toast.id)}
          >
            <Text className="text-center text-base font-semibold text-white">{toast.message}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
