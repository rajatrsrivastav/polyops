import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../components/theme';
import { DeskIcon } from './DeskIcon';

const destinations = [
  { label: 'Desk', icon: 'desk', href: '/(staff)' },
  { label: 'Dispatch', icon: 'dispatch', href: '/dispatch' },
  { label: 'Stock', icon: 'stock', href: '/receive' },
  { label: 'More', icon: 'more', href: '/more' },
] as const;

export function FactoryDock() {
  const path = usePathname();
  const [typing, setTyping] = useState(Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setTyping(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setTyping(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (typing) return null;
  const section = path === '/dispatch' || path.startsWith('/orders/') ? 'Dispatch'
    : path === '/receive' || path.startsWith('/movements/') || path === '/admin/materials' ? 'Stock'
    : path === '/more' || path === '/admin/reports' || path === '/admin/brief' ? 'More' : 'Desk';
  return (
    <SafeAreaView edges={['bottom','left','right']} style={s.base}>
      <View accessibilityRole="tablist" style={s.dock}>
        {destinations.map(({ label, icon, href }) => {
          const selected = section === label;
          return (
            <Pressable key={label} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }}
              onPress={() => {
                if (path === (label === 'Desk' ? '/' : href)) return;
                router.dismissTo(href);
              }}
              style={({ pressed }) => [s.item, selected && s.selected, pressed && s.pressed]}>
              <DeskIcon name={icon} color={selected ? colors.accent : colors.muted} size={22} />
              <Text style={[s.label, selected && s.activeLabel]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  base: { backgroundColor: colors.paper, alignItems: 'center', paddingHorizontal: 14, paddingTop: 4, paddingBottom: 4 },
  dock: { flexDirection: 'row', width: '100%', maxWidth: 460, borderRadius: 30, padding: 4, backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, shadowColor: colors.deep, shadowOpacity: 0.12, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 4 },
  item: { flex: 1, minHeight: 48, paddingVertical: 4, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 25 },
  selected: { backgroundColor: colors.wash },
  pressed: { opacity: 0.65 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '500', textAlign: 'center' },
  activeLabel: { color: colors.accent, fontWeight: '700' },
});
