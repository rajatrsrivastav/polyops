import { useRef, useState } from 'react';
import { router, type Href } from 'expo-router';
import {
  Alert, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api, type FactoryProfile, type Page, type StaffOrder } from '../../lib/api';
import { signOut } from '../../lib/session';
import { Button, displayFamily, ErrorNotice, Loading } from '../../components/ui';
import { money } from '../../features/admin/data';
import { DeskIcon, type DeskIconName } from '../../features/desk/DeskIcon';
import { colors as c } from '../../components/theme';

import { orderStatus, statusInfo } from '../../features/desk/orderDisplay';

const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata',
});
type Action = { label: string; icon: DeskIconName; href: Href };
const receive: Action = { label: 'Receive stock', icon: 'receive', href: '/receive' };
const dispatch: Action = { label: 'Dispatch', icon: 'dispatch', href: '/dispatch' };
const catalog: Action = { label: 'Catalog', icon: 'stock', href: '/admin/materials' };
const reports: Action = { label: 'Reports', icon: 'report', href: '/admin/reports' };

function OrderCard({ order, owner }: { order: StaffOrder; owner: boolean }) {
  const state = orderStatus(order.status);
  const units = order.items.reduce((total, item) => total + item.qty, 0);
  const date = new Date(order.createdAt);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open order ${order.code} for ${order.customerName}, ${state.label}`}
      onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order._id } })}
      style={({ pressed }) => [s.order, pressed && s.pressed]}
    >
      <View style={s.row}>
        <View style={s.orderIdentity}>
          <Text style={s.orderName}>{order.customerName}</Text>
          <Text style={s.caption}>
            {order.code}{Number.isFinite(date.getTime()) ? `  ·  ${dateFormat.format(date)}` : ''}
          </Text>
        </View>
        <View style={[s.status, { backgroundColor: state.fill }]}>
          <Text style={[s.statusText, { color: state.text }]}>{state.label}</Text>
        </View>
      </View>
      <View style={s.orderFooter}>
        <Text style={[s.caption, s.orderIdentity]}>{units} {units === 1 ? 'unit' : 'units'} · {order.items.length} {order.items.length === 1 ? 'line' : 'lines'}</Text>
        {owner && order.subtotalPaise !== undefined && (
          <Text style={s.amount}>{money(order.subtotalPaise)}</Text>
        )}
        <DeskIcon name="chevron" color={c.muted} size={17} />
      </View>
    </Pressable>
  );
}

export default function FactoryDesk() {
  const profile = useQuery({ queryKey: ['me'], queryFn: () => api<FactoryProfile>('/me') });
  const owner = profile.data?.role === 'owner';
  const shortcuts = owner ? [receive, dispatch, catalog, reports] : [receive, dispatch];
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('');
  const list = useRef<FlatList<StaffOrder>>(null);
  const filters = [
    { value: '', label: owner ? 'All orders' : 'Open today' },
    ...['pending', 'packed', 'shipped', ...(owner ? ['delivered', 'cancelled'] : [])].map((value) =>
      ({ value, label: statusInfo[value]?.label ?? value }),
    ),
  ];
  const orders = useInfiniteQuery({
    queryKey: ['orders', 'desk', owner, term, status],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: '12', q: term });
      if (status) params.set('status', status);
      return api<Page<StaffOrder>>(`/orders?${params}`);
    },
    getNextPageParam: (last) => last.page * last.limit < last.total ? last.page + 1 : undefined,
  });
  const rows = orders.data?.pages.flatMap((page) => page.items) ?? [];
  const openMenuLink = (href: Href) => { setMenu(false); router.push(href); };
  const submitSearch = () => {
    setTerm(search.trim());
    Keyboard.dismiss();
  };
  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={s.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <View style={[s.row, s.headerLine]}>
            <View style={s.brand}>
              <View style={s.mark}><DeskIcon name="stock" color={c.deep} size={21} /></View>
              <Text style={s.brandName}>PolyOps</Text>
            </View>
            <Text style={s.role}>{owner ? 'Admin' : 'Staff'}</Text>
          </View>
          <Text accessibilityRole="header" style={s.shop}>{profile.data?.shopName ?? 'Factory desk'}</Text>
        </View>

        <FlatList
          ref={list}
          style={s.body}
          contentContainerStyle={s.content}
          data={rows}
          keyExtractor={(order) => order._id}
          renderItem={({ item }) => <OrderCard order={item} owner={owner} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshing={orders.isRefetching}
          onRefresh={() => { void orders.refetch(); }}
          ListHeaderComponent={(
            <View style={s.sections}>
              <View style={s.shortcuts}>
                <Text accessibilityRole="header" style={s.sectionTitle}>Quick actions</Text>
                <View style={s.shortcutRow}>
                  {shortcuts.map((action) => (
                    <Pressable key={action.label} accessibilityRole="button" onPress={() => router.push(action.href)} style={({ pressed }) => [s.shortcut, pressed && s.pressed]}>
                      <View style={s.actionIcon}>
                        <DeskIcon name={action.icon} color={c.ink} size={23} />
                      </View>
                      <Text style={s.shortcutLabel}>{action.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={s.orderTools}>
                <Text accessibilityRole="header" style={s.sectionTitle}>{owner ? 'Buyer orders' : 'Today’s dispatch'}</Text>
                <View style={s.search}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Search orders" style={s.searchIcon} onPress={submitSearch}>
                    <DeskIcon name="search" color={c.accent} size={21} />
                  </Pressable>
                  <TextInput
                    accessibilityLabel="Search by buyer or order number"
                    placeholder="Buyer or order number"
                    placeholderTextColor={c.muted}
                    style={s.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={submitSearch}
                    returnKeyType="search"
                    maxLength={100}
                  />
                  {search.length > 0 && (
                    <Pressable accessibilityRole="button" accessibilityLabel="Clear search" style={s.searchIcon} onPress={() => { setSearch(''); setTerm(''); }}>
                      <DeskIcon name="close" color={c.muted} size={19} />
                    </Pressable>
                  )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.filters}>
                  {filters.map((filter) => (
                    <Pressable key={filter.label} accessibilityRole="button" accessibilityState={{ selected: filter.value === status }} style={[s.filter, filter.value === status && s.filterActive]} onPress={() => setStatus(filter.value)}>
                      <Text style={[s.filterText, filter.value === status && s.filterTextActive]}>{filter.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <ErrorNotice error={orders.error} />
              {orders.error && <Button title="Retry orders" secondary onPress={() => { void orders.refetch(); }} />}
            </View>
          )}
          ListEmptyComponent={orders.isPending ? <Loading /> : orders.error ? undefined : (
            <View style={s.empty}>
              <Text style={s.sectionTitle}>No orders found</Text>
              <Text style={s.caption}>{term || status ? 'Try another buyer or change the status filter.' : 'New buyer orders will appear here.'}</Text>
            </View>
          )}
          ListFooterComponent={orders.hasNextPage ? (
            <Button title={orders.isFetchingNextPage ? 'Loading orders…' : 'Load more orders'} secondary disabled={orders.isFetching} onPress={() => { void orders.fetchNextPage(); }} />
          ) : undefined}
        />

        <SafeAreaView style={s.footer} edges={['bottom']}>
          <View style={s.dock}>
            <DockItem label="Desk" icon="desk" selected onPress={() => list.current?.scrollToOffset({ offset: 0 })} />
            <DockItem label="Dispatch" icon="dispatch" onPress={() => router.push('/dispatch')} />
            {owner && (
              <Pressable accessibilityRole="button" accessibilityLabel="Create buyer order" style={({ pressed }) => [s.create, pressed && s.pressed]} onPress={() => router.push('/admin/newOrder')}>
                <DeskIcon name="plus" color={c.deep} size={22} />
                <Text style={s.createLabel}>New order</Text>
              </Pressable>
            )}
            <DockItem label="Stock" icon="stock" onPress={() => router.push('/receive')} />
            <DockItem label="More" icon="more" onPress={() => { Keyboard.dismiss(); setMenu(true); }} />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <Modal visible={menu} animationType="slide" transparent onRequestClose={() => setMenu(false)}>
        <View style={s.modal}>
          <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={() => setMenu(false)} />
          <SafeAreaView style={s.sheet} edges={['bottom', 'left', 'right']} accessibilityViewIsModal>
            <View style={s.row}>
              <Text accessibilityRole="header" style={s.sectionTitle}>Workspace</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close workspace menu" style={s.searchIcon} onPress={() => setMenu(false)}>
                <DeskIcon name="close" color={c.ink} />
              </Pressable>
            </View>
            {owner && (
              <>
                <Button title="Material catalog" secondary onPress={() => openMenuLink(catalog.href)} />
                <Button title="Operations reports" secondary onPress={() => openMenuLink(reports.href)} />
                <Button title="Weekly brief" secondary onPress={() => openMenuLink('/admin/brief')} />
              </>
            )}
            <Button title="Sign out" secondary onPress={() => {
              Alert.alert('Sign out of PolyOps?', undefined, [
                { text: 'Stay signed in', style: 'cancel' },
                { text: 'Sign out', style: 'destructive', onPress: () => { setMenu(false); void signOut(); } },
              ]);
            }} />
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DockItem({ label, icon, selected, onPress }: {
  label: string; icon: DeskIconName; selected?: boolean; onPress?: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: Boolean(selected) }} onPress={onPress} style={({ pressed }) => [s.dockItem, selected && s.dockActive, pressed && s.pressed]}>
      <DeskIcon name={icon} color={selected ? c.accent : c.muted} size={20} />
      <Text style={[s.dockLabel, selected && s.dockSelected]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.paper },
  body: { flex: 1, backgroundColor: c.paper },
  header: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line, backgroundColor: c.paper, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 18, gap: 11 },
  headerLine: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { backgroundColor: c.highlight, borderRadius: 4, width: 31, height: 31, alignItems: 'center', justifyContent: 'center' },
  brandName: { color: c.ink, fontSize: 19, fontWeight: '700', letterSpacing: -1 },
  role: { color: c.muted, backgroundColor: c.wash, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: '700', overflow: 'hidden' },
  shop: { color: c.ink, fontFamily: displayFamily, fontSize: 32, letterSpacing: -0.9 },
  content: { padding: 14, gap: 9, paddingBottom: 18 },
  sections: { gap: 15, marginBottom: 2 },
  shortcuts: { borderBottomWidth: 1, borderColor: c.line, paddingTop: 3, paddingBottom: 10, gap: 9 },
  sectionTitle: { color: c.ink, fontFamily: displayFamily, fontSize: 22, letterSpacing: -0.4 },
  shortcutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 },
  shortcut: { flex: 1, gap: 6, minHeight: 69, alignItems: 'center', paddingVertical: 3 },
  actionIcon: { width: 41, height: 41, borderRadius: 4, backgroundColor: c.wash, justifyContent: 'center', alignItems: 'center' },
  shortcutLabel: { color: c.ink, fontSize: 12, textAlign: 'center', fontWeight: '700' },
  orderTools: { gap: 8 },
  search: { flexDirection: 'row', alignItems: 'center', minHeight: 46, backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: 4 },
  searchIcon: { width: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  searchInput: { flex: 1, minHeight: 44, fontSize: 16, color: c.ink, paddingRight: 10 },
  filters: { gap: 7 },
  filter: { paddingHorizontal: 12, minHeight: 44, justifyContent: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 4 },
  filterActive: { backgroundColor: c.accent, borderColor: c.accent },
  filterText: { color: c.muted, fontWeight: '700', fontSize: 13 },
  filterTextActive: { color: '#FFFFFF' },
  order: { borderBottomColor: c.line, borderBottomWidth: 1, paddingHorizontal: 3, paddingVertical: 12, gap: 8 },
  orderIdentity: { flex: 1, gap: 3 },
  orderName: { color: c.ink, fontSize: 17, fontWeight: '600' },
  caption: { color: c.muted, fontSize: 13, lineHeight: 18 },
  status: { maxWidth: '42%', borderRadius: 4, paddingVertical: 4, paddingHorizontal: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  orderFooter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  amount: { color: c.ink, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  empty: { borderWidth: 1, borderColor: c.line, borderRadius: 4, padding: 15, backgroundColor: c.surface, gap: 4 },
  footer: { backgroundColor: c.surface, borderTopColor: c.line, borderTopWidth: 1 },
  dock: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, gap: 3 },
  dockItem: { flex: 1, minHeight: 48, borderRadius: 4, alignItems: 'center', justifyContent: 'center', gap: 3 },
  dockActive: { backgroundColor: c.wash },
  dockLabel: { color: c.muted, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  dockSelected: { color: c.accent },
  create: { minHeight: 48, minWidth: 74, alignItems: 'center', justifyContent: 'center', backgroundColor: c.highlight, borderRadius: 4, paddingHorizontal: 7 },
  createLabel: { color: c.deep, textAlign: 'center', fontSize: 11, fontWeight: '800' },
  pressed: { opacity: 0.65 },
  modal: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#27232180' },
  sheet: { backgroundColor: c.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, gap: 9 },
});
