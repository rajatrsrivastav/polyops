import { useState } from 'react';
import { router, type Href } from 'expo-router';
import {
  FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api, type FactoryProfile, type Page, type StaffOrder } from '../../lib/api';
import { Button, ErrorNotice, Loading } from '../../components/ui';
import { money } from '../../features/admin/data';
import { DeskIcon, type DeskIconName } from '../../features/desk/DeskIcon';
import { colors as c } from '../../components/theme';

import { orderStatus, statusInfo } from '../../features/desk/orderDisplay';

const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata',
});
type Action = { label: string; icon: DeskIconName; href: Href };
const create: Action = { label: 'New order', icon: 'plus', href: '/admin/newOrder' };
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
  const shortcuts = owner ? [create, receive, catalog, reports] : [receive, dispatch];
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('');
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
  const submitSearch = () => {
    setTerm(search.trim());
    Keyboard.dismiss();
  };
  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={s.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
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
              <View style={s.shortcuts}>
                <View style={s.shortcutRow}>
                  {shortcuts.map((action) => (
                    <Pressable key={action.label} accessibilityRole="button" onPress={() => router.push(action.href)} style={({ pressed }) => [s.shortcut, pressed && s.pressed]}>
                      <View style={[s.actionIcon, (action === create || (!owner && action === receive)) && s.primaryIcon]}>
                        <DeskIcon name={action.icon} color={c.ink} size={23} />
                      </View>
                      <Text style={s.shortcutLabel}>{action.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={s.orderTools}>
                <View style={s.sectionHeading}>
                  <Text accessibilityRole="header" style={s.sectionTitle}>{owner ? 'Buyer orders' : 'Today’s dispatch'}</Text>
                  {orders.data && <Text accessibilityLabel={`${orders.data.pages[0]?.total} matching orders`} style={s.resultCount}>{orders.data.pages[0]?.total}</Text>}
                </View>
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

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.paper },
  body: { flex: 1, backgroundColor: c.paper },
  header: { gap: 12, paddingTop: 2 },
  headerLine: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  mark: { backgroundColor: c.highlight, borderRadius: 8, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  brandName: { color: c.ink, fontSize: 17, fontWeight: '700', letterSpacing: -0.65 },
  role: { color: c.muted, fontSize: 13, fontWeight: '600' },
  shop: { color: c.ink, fontSize: 34, fontWeight: '700', letterSpacing: -1.35 },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20 },
  sections: { gap: 16, marginBottom: 8 },
  shortcuts: { paddingBottom: 17, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
  sectionTitle: { color: c.ink, fontSize: 23, fontWeight: '700', letterSpacing: -0.75 },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  resultCount: { color: c.muted, fontSize: 15, fontVariant: ['tabular-nums'] },
  shortcutRow: { flexDirection: 'row', gap: 8 },
  shortcut: { flex: 1, minHeight: 60, gap: 5, alignItems: 'center', justifyContent: 'center' },
  actionIcon: { width: 44, height: 38, borderRadius: 12, backgroundColor: c.wash, justifyContent: 'center', alignItems: 'center' },
  primaryIcon: { backgroundColor: c.highlight },
  shortcutLabel: { color: c.ink, fontSize: 12, textAlign: 'center', fontWeight: '600' },
  orderTools: { gap: 8 },
  search: { flexDirection: 'row', alignItems: 'center', minHeight: 44, backgroundColor: c.wash, borderRadius: 13 },
  searchIcon: { width: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  searchInput: { flex: 1, minHeight: 44, fontSize: 16, color: c.ink, paddingRight: 10 },
  filters: { gap: 6 },
  filter: { paddingHorizontal: 13, minHeight: 44, justifyContent: 'center', borderRadius: 22 },
  filterActive: { backgroundColor: c.deep },
  filterText: { color: c.muted, fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: c.surface },
  order: { borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 2, paddingVertical: 14, gap: 8 },
  orderIdentity: { flex: 1, gap: 3 },
  orderName: { color: c.ink, fontSize: 17, fontWeight: '600' },
  caption: { color: c.muted, fontSize: 13, lineHeight: 18 },
  status: { maxWidth: '42%', borderRadius: 12, paddingVertical: 3, paddingHorizontal: 9 },
  statusText: { fontSize: 12, fontWeight: '700' },
  orderFooter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  amount: { color: c.ink, fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  empty: { borderWidth: 1, borderColor: c.line, borderRadius: 4, padding: 15, backgroundColor: c.surface, gap: 4 },
  pressed: { opacity: 0.65 },
});
