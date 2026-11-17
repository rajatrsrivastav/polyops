import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useTranslation } from '@/i18n';

export function QuickActionGrid() {
  const { t } = useTranslation();

  const actions = [
    {
      label: t('owner.addExpense'),
      href: '/(owner)/expense-new' as const,
      tone: 'bg-brand-600',
    },
    {
      label: t('owner.markAttendance'),
      href: '/(owner)/attendance' as const,
      tone: 'bg-emerald-600',
    },
    {
      label: t('owner.newInvoice'),
      href: '/(owner)/invoice-new' as const,
      tone: 'bg-slate-800',
    },
    {
      label: t('owner.newChallan'),
      href: '/(owner)/challan-new' as const,
      tone: 'bg-amber-600',
    },
  ] as const;

  return (
    <View className="gap-3">
      <Text className="text-xl font-semibold text-brand-900">{t('owner.quickActions')}</Text>
      <View className="flex-row flex-wrap gap-3">
        {actions.map((action) => (
          <Pressable
            key={action.href}
            accessibilityRole="button"
            className={`min-h-16 w-[47%] flex-grow items-center justify-center rounded-2xl px-3 py-4 active:opacity-80 ${action.tone}`}
            onPress={() => router.push(action.href)}
          >
            <Text className="text-center text-base font-bold text-white">{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
