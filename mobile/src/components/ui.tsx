import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
export const colors = {
  ink: '#1B3A4B',
  paper: '#F6F4EF',
  amber: '#E8A838',
  muted: '#52666D',
  line: '#D5DED7',
};
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, gap: 20, flexGrow: 1 },
  heading: { fontSize: 30, fontWeight: '600', color: colors.ink },
  sub: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  eyebrow: { fontSize: 12, letterSpacing: 2, color: colors.muted, fontWeight: '600' },
  card: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  title: { color: colors.ink, fontSize: 19, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  input: {
    borderColor: '#AABAB4',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    minHeight: 50,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: '#FFF',
  },
  label: { fontSize: 16, color: colors.ink, marginBottom: 8 },
  error: {
    color: '#92362E',
    fontSize: 16,
    padding: 14,
    backgroundColor: '#FFF0EB',
    borderRadius: 8,
  },
  button: {
    minHeight: 50,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.ink,
  },
  buttonText: { fontSize: 16, color: '#FFF', fontWeight: '600' },
  secondary: { backgroundColor: '#FFF', borderColor: colors.line, borderWidth: 1 },
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
});
export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
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
      <Text style={styles.sub}>Loading your packing desk…</Text>
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
