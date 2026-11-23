import { useRef, useState, type ComponentRef } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';
import { configured, signIn, useSession } from '../lib/session';
import { colors, ErrorNotice, Loading, Screen } from '../components/ui';

export default function Login() {
  const session = useSession();
  const passwordInput = useRef<ComponentRef<typeof TextInput>>(null);
  const submitting = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  if (session.loading) return <Screen top><Loading /></Screen>;
  if (session.user) return <Redirect href="/(staff)" />;
  const disabled = !configured || busy || !email.trim() || !password;

  async function login() {
    if (disabled || submitting.current) return;
    submitting.current = true;
    Keyboard.dismiss();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Sign-in could not be completed. Try again.'));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <Screen top>
      <View style={s.page}>
        <View style={s.masthead}>
          <View style={s.wordmark}>
            <View accessible={false} style={s.mark}>
              <View style={s.longStroke} />
              <View style={s.shortStroke} />
            </View>
            <Text style={s.brand}>PolyOps</Text>
          </View>
          <Text style={s.context}>Factory operations</Text>
        </View>

        <View style={s.intro}>
          <Text accessibilityRole="header" style={s.heading}>Factory desk</Text>
          <Text style={s.lede}>Sign in to receive material, check stock and dispatch buyer orders.</Text>
        </View>

        {!configured && <Text accessibilityRole="alert" style={s.notice}>The factory API address is missing. Check the mobile setup guide.</Text>}

        <View style={s.form}>
          <View style={s.field}>
            <Text style={s.label}>Email address</Text>
            <TextInput
              accessibilityLabel="Email address" autoCapitalize="none" autoCorrect={false}
              autoComplete="email" keyboardType="email-address" returnKeyType="next"
              editable={configured && !busy} value={email} onChangeText={setEmail}
              onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
              onSubmitEditing={() => passwordInput.current?.focus()}
              style={[s.input, s.fieldBox, focused === 'email' && s.focused]}
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={[s.fieldBox, s.passwordRow, focused === 'password' && s.focused]}>
              <TextInput
                ref={passwordInput} accessibilityLabel="Password" autoComplete="current-password"
                secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false}
                returnKeyType="go" editable={configured && !busy} value={password}
                onChangeText={setPassword} onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)} onSubmitEditing={() => { void login(); }}
                style={[s.input, s.password]}
              />
              <Pressable
                accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                onPress={() => setShowPassword((visible) => !visible)} style={s.toggle}
              >
                <Text style={s.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
          </View>
          <ErrorNotice error={error} />
          <Pressable accessibilityRole="button" accessibilityLabel="Sign in" disabled={disabled}
            accessibilityState={{ disabled, busy }} onPress={() => { void login(); }}
            style={({ pressed }) => [s.submit, disabled && s.inactive, pressed && s.pressed]}>
            <Text style={s.submitLabel}>{busy ? 'Signing in…' : 'Sign in'}</Text>
            <Text accessible={false} style={s.arrow}>→</Text>
          </Pressable>
          <Text style={s.help}>Use the account issued by your factory administrator.</Text>
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  page: { alignSelf: 'center', width: '100%', maxWidth: 480, paddingHorizontal: 8, paddingBottom: 32 },
  masthead: { minHeight: 54, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  wordmark: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  brand: { color: colors.ink, fontSize: 22, fontWeight: '700', letterSpacing: -1.2 },
  mark: { width: 24, height: 24, flexDirection: 'row', gap: 3, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-16deg' }] },
  longStroke: { width: 7, height: 22, backgroundColor: colors.accent },
  shortStroke: { width: 7, height: 14, backgroundColor: colors.accent, alignSelf: 'flex-start', marginTop: 1 },
  context: { fontSize: 13, color: colors.muted },
  intro: { marginTop: 42, marginBottom: 29, gap: 10 },
  heading: { color: colors.ink, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }), fontSize: 44, letterSpacing: -1.7 },
  lede: { maxWidth: 320, color: colors.muted, fontSize: 16, lineHeight: 23 },
  form: { gap: 18 },
  field: { gap: 7 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  fieldBox: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 4 },
  focused: { borderColor: colors.accent },
  input: { minHeight: 51, paddingHorizontal: 12, paddingVertical: 11, color: colors.ink, fontSize: 17 },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  password: { flex: 1 },
  toggle: { minHeight: 48, minWidth: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  toggleText: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  submit: { backgroundColor: colors.ink, minHeight: 51, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  submitLabel: { fontSize: 16, fontWeight: '700', color: colors.surface },
  arrow: { color: colors.surface, fontSize: 22 },
  inactive: { backgroundColor: colors.muted },
  pressed: { opacity: 0.8 },
  help: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  notice: { color: colors.ink, marginBottom: 14, fontSize: 14, lineHeight: 19 },
});
