import { Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/i18n';

export function LanguageToggle() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <View className="flex-row items-center justify-center gap-2">
      <Text className="text-sm text-slate-500">{t('common.language')}</Text>
      <Pressable
        accessibilityRole="button"
        className={`min-h-11 min-w-20 items-center justify-center rounded-xl px-3 ${locale === 'hi' ? 'bg-brand-600' : 'bg-white border border-slate-200'}`}
        onPress={() => setLocale('hi')}
      >
        <Text className={`font-semibold ${locale === 'hi' ? 'text-white' : 'text-slate-700'}`}>
          {t('common.switchToHindi')}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        className={`min-h-11 min-w-20 items-center justify-center rounded-xl px-3 ${locale === 'en' ? 'bg-brand-600' : 'bg-white border border-slate-200'}`}
        onPress={() => setLocale('en')}
      >
        <Text className={`font-semibold ${locale === 'en' ? 'text-white' : 'text-slate-700'}`}>
          {t('common.switchToEnglish')}
        </Text>
      </Pressable>
    </View>
  );
}
