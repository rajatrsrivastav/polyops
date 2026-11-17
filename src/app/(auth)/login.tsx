import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useLogin } from '@/features/auth/hooks/use-login';
import { useTranslation } from '@/i18n';
import { LanguageToggle } from '@/shared/components/LanguageToggle';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { Screen } from '@/shared/components/Screen';
import { useAuthStore } from '@/shared/store/auth-store';
import { toast } from '@/shared/store/toast-store';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useLogin();
  const bootstrapError = useAuthStore((state) => state.error);
  const screenError = error ?? bootstrapError;

  async function onSubmit() {
    const result = await login({ email, password });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    if (result.role === 'employee') {
      router.replace('/(employee)/attendance');
      return;
    }

    router.replace('/(owner)');
  }

  return (
    <Screen
      title={t('appName')}
      error={screenError}
      footer={
        <View className="gap-3">
          <PrimaryButton
            label={t('auth.submit')}
            onPress={() => {
              void onSubmit();
            }}
            isLoading={isLoading}
          />
          <LanguageToggle />
        </View>
      }
    >
      <Text className="mb-8 text-body-lg text-slate-600">{t('auth.tagline')}</Text>

      <View className="gap-5">
        <View>
          <Text className="mb-2 text-lg font-semibold text-slate-800">{t('auth.email')}</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            className="min-h-14 rounded-2xl border border-slate-300 bg-white px-4 text-xl text-slate-900"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="owner@factory.com"
            returnKeyType="next"
            textContentType="username"
            value={email}
          />
        </View>

        <View>
          <Text className="mb-2 text-lg font-semibold text-slate-800">{t('auth.password')}</Text>
          <TextInput
            autoCapitalize="none"
            className="min-h-14 rounded-2xl border border-slate-300 bg-white px-4 text-xl text-slate-900"
            onChangeText={setPassword}
            placeholder="••••••••"
            returnKeyType="done"
            secureTextEntry
            textContentType="password"
            value={password}
            onSubmitEditing={() => {
              void onSubmit();
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
