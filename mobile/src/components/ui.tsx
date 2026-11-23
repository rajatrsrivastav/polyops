import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './theme';
export { colors } from './theme';
export const displayFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16, gap: 14, flexGrow: 1 },
  heading: { fontFamily: displayFamily, fontSize: 32, color: colors.ink, letterSpacing: -0.9 },
  sub: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  eyebrow: { fontSize: 12, letterSpacing: 2, color: colors.muted, fontWeight: '600' },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    padding: 15,
    gap: 12,
  },
  title: { color: colors.ink, fontSize: 17, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  input: {
    borderColor: '#A69F95',
    borderWidth: 1,
    borderRadius: 4,
    padding: 14,
    minHeight: 50,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink, marginBottom: 7 },
  error: {
    color: '#92362E',
    fontSize: 16,
    padding: 14,
    backgroundColor: '#FFF0EB',
    borderRadius: 4,
  },
  button: {
    minHeight: 50,
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.ink,
  },
  buttonText: { fontSize: 16, color: '#FFF', fontWeight: '600' },
  secondary: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1 },
  secondaryText: { color: colors.ink },
  disabled: { opacity: 0.5 },
  badge: {
    color: '#7D510D',
    backgroundColor: '#FFF0D2',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    textTransform: 'capitalize',
    fontSize: 14,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 8 },
  intro: { gap: 5, paddingTop: 3, paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  foot: { backgroundColor: colors.surface, borderTopColor: colors.line, borderTopWidth: 1, padding: 12, gap: 8 },
  pair: { flex: 1, gap: 3 },
  caption: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  amount: { color: colors.ink, fontWeight: '800', fontSize: 19, fontVariant: ['tabular-nums'] },
  chip: { backgroundColor: colors.wash, color: colors.accent, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 5, fontWeight: '700', overflow: 'hidden', alignSelf: 'flex-start' },
});
export function Screen({ children, footer, top }: { children: ReactNode; footer?: ReactNode; top?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={top ? ['top', 'bottom', 'left', 'right'] : ['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {children}
        </ScrollView>
        {footer ? <View style={styles.foot}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function PageIntro({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.intro}>
      <Text accessibilityRole="header" style={styles.heading}>{title}</Text>
      {description ? <Text style={styles.sub}>{description}</Text> : null}
    </View>
  );
}
export function Button({
  title,
  onPress,
  disabled,
  secondary,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (pressed || disabled) && styles.disabled,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>
    </Pressable>
  );
}
export function Loading() {
  return (
    <View style={styles.card} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.ink} />
      <Text style={styles.sub}>Loading factory operations…</Text>
    </View>
  );
}
export function ErrorNotice({ error }: { error: Error | null }) {
  return error ? (
    <Text accessibilityRole="alert" style={styles.error}>
      {error.message}
    </Text>
  ) : null;
}
