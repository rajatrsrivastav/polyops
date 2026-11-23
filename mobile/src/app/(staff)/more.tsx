import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api, type FactoryProfile } from '../../lib/api';
import { signOut } from '../../lib/session';
import { Screen, colors, PageIntro } from '../../components/ui';
import { DeskIcon } from '../../features/desk/DeskIcon';

const tools = [
  { name: 'Material catalog', path: '/admin/materials' },
  { name: 'Operations reports', path: '/admin/reports' },
  { name: 'Weekly brief', path: '/admin/brief' },
] as const;

export default function More() {
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<FactoryProfile>('/me') });
  return <Screen>
    <PageIntro title={me.data?.shopName ?? 'Workspace'} description={me.data?.role === 'owner' ? 'Administrator account' : 'Factory staff account'} />
    <View style={s.group}>
      {me.data?.role === 'owner' && tools.map(({ name, path }) => (
        <Pressable key={path} accessibilityRole="button" onPress={() => router.push(path)}
          style={({ pressed }) => [s.row, s.divider, pressed && s.pressed]}>
          <Text style={s.label}>{name}</Text><DeskIcon name="chevron" size={16} color={colors.muted} />
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" style={({ pressed }) => [s.row, pressed && s.pressed]}
        onPress={() => Alert.alert('Sign out of PolyOps?', undefined, [
          { text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => { void signOut(); } },
        ])}><Text style={[s.label, s.signOut]}>Sign out</Text></Pressable>
    </View>
  </Screen>;
}
const s = StyleSheet.create({
  group: { borderRadius: 18, backgroundColor: colors.surface, paddingHorizontal: 16 },
  row: { minHeight: 54, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  label: { fontSize: 17, color: colors.ink, flexShrink: 1 },
  signOut: { color: colors.accent },
  pressed: { opacity: 0.6 },
});
