import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DeskIcon } from '../features/desk/DeskIcon';
import { money } from '../features/admin/data';
import type { StaffProduct } from '../lib/api';
import { Button, colors, styles } from './ui';

export function InventorySearch({ value, change, submit }: {
  value: string; change: (value: string) => void; submit: () => void;
}) {
  function search() {
    submit();
    Keyboard.dismiss();
  }
  return (
    <View style={s.search}>
      <TextInput accessibilityLabel="Search by material grade or SKU" placeholder="Material grade or SKU"
        placeholderTextColor={colors.muted} style={s.input} value={value} onChangeText={change}
        maxLength={100} returnKeyType="search" onSubmitEditing={search} />
      <Pressable accessibilityRole="button" accessibilityLabel="Search materials" style={s.searchButton} onPress={search}>
        <DeskIcon name="search" color={colors.accent} size={20} />
      </Pressable>
    </View>
  );
}

export function MaterialRow({ item, pricePaise, action, select, disabled }: {
  item: StaffProduct; pricePaise?: number; action: string; select: () => void; disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${action} ${item.name}, ${item.sku}, ${item.stock} units available`}
      accessibilityState={{ disabled }} disabled={disabled} onPress={select}
      style={({ pressed }) => [styles.card, s.material, (pressed || disabled) && styles.disabled]}>
      <View style={s.icon}><DeskIcon name="stock" color={colors.accent} /></View>
      <View style={styles.pair}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.caption}>{item.sku}{pricePaise === undefined ? '' : `  ·  ${money(pricePaise)} / unit`}</Text>
      </View>
      <View style={s.stock}>
        <Text style={styles.title}>{item.stock}</Text>
        <Text style={styles.caption}>available</Text>
      </View>
      <DeskIcon name="chevron" color={colors.muted} size={16} />
    </Pressable>
  );
}

export function Pager({ page, limit, total, change }: {
  page: number; limit: number; total: number; change: (page: number) => void;
}) {
  if (total <= limit && page === 1) return null;
  return (
    <View style={styles.row}>
      <Button title="Previous" secondary disabled={page <= 1} onPress={() => change(page - 1)} />
      <Text style={styles.caption}>Page {page} of {Math.max(1, Math.ceil(total / limit))}</Text>
      <Button title="Next" secondary disabled={page * limit >= total} onPress={() => change(page + 1)} />
    </View>
  );
}

const s = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, borderRadius: 12 },
  input: { flex: 1, minHeight: 48, paddingHorizontal: 12, color: colors.ink, fontSize: 16 },
  searchButton: { width: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  material: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 9 },
  icon: { width: 38, height: 38, backgroundColor: colors.wash, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  stock: { alignItems: 'flex-end' },
});
