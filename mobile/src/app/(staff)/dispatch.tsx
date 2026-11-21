import { useState } from 'react';
import { FlatList, Keyboard, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api, type FactoryProfile, type Page, type StaffOrder } from '../../lib/api';
import { Button, ErrorNotice, Loading, PageIntro, colors, styles } from '../../components/ui';
import { Pager } from '../../components/inventory';
import { DeskIcon } from '../../features/desk/DeskIcon';
import { formatDateTime, orderStatus } from '../../features/desk/orderDisplay';
export default function Dispatch() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [showDates, setShowDates] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [dates, setDates] = useState({ from: '', to: '' });
  const [dateError, setDateError] = useState<Error | null>(null);
  const [status, setStatus] = useState('pending');
  const profile = useQuery({ queryKey: ['me'], queryFn: () => api<FactoryProfile>('/me') });
  const isAdmin = profile.data?.role === 'owner';
  const statuses = [
    { value: 'pending', label: 'To pack' },
    { value: 'packed', label: 'To dispatch' },
    { value: 'shipped', label: 'Dispatched' },
    ...(isAdmin ? [
      { value: 'delivered', label: 'Delivered' },
      { value: 'cancelled', label: 'Cancelled' },
    ] : []),
  ];
  const query = useQuery({
    queryKey: ['orders', 'dispatch', page, q, status, dates],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), status, q });
      if (isAdmin && dates.from) params.set('from', dates.from);
      if (isAdmin && dates.to) params.set('to', dates.to);
      return api<Page<StaffOrder>>(`/orders?${params}`);
    },
  });
  function submitSearch() {
    const validDate = (value: string) => {
      if (!value) return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(`${value}T00:00:00Z`);
      return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
    };
    if (isAdmin && (!validDate(from) || !validDate(to) || (from && to && from > to))) {
      setDateError(new Error('Use YYYY-MM-DD dates, with the start on or before the end.'));
      return;
    }
    setDateError(null);
    setDates(isAdmin ? { from, to } : { from: '', to: '' });
    setQ(search.trim());
    Keyboard.dismiss();
    setPage(1);
  }
  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={query.data?.items ?? []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.content}
        refreshing={query.isRefetching}
        onRefresh={() => {
          void query.refetch();
        }}
        ListHeaderComponent={
          <View style={{ gap: 18 }}>
            <PageIntro title="Buyer dispatch" description={isAdmin ? 'Track packing, dispatch and delivery.' : 'Orders created today, India time.'} />
            <View style={styles.card}>
              <TextInput accessibilityLabel="Search by buyer or order code" placeholder="Buyer or order code" placeholderTextColor={colors.muted}
                value={search} onChangeText={setSearch} onSubmitEditing={submitSearch} returnKeyType="search" maxLength={100} style={styles.input} />
              {isAdmin && (
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: showDates }}
                  onPress={() => setShowDates((current) => !current)} style={s.dateToggle}>
                  <Text style={styles.title}>{showDates ? 'Hide date filter' : 'Filter by date'}</Text>
                  <DeskIcon name="chevron" color={colors.muted} size={16} />
                </Pressable>
              )}
              {isAdmin && showDates && (
                <View style={{ gap: 8 }}>
                  <TextInput accessibilityLabel="Start date" placeholder="From YYYY-MM-DD" placeholderTextColor={colors.muted} value={from} onChangeText={setFrom} maxLength={10} style={styles.input} />
                  <TextInput accessibilityLabel="End date" placeholder="To YYYY-MM-DD" placeholderTextColor={colors.muted} value={to} onChangeText={setTo} maxLength={10} style={styles.input} />
                  <Button title="Clear dates" secondary onPress={() => { setFrom(''); setTo(''); setDates({ from: '', to: '' }); setPage(1); setDateError(null); }} />
                </View>
              )}
              {dates.from || dates.to ? <Text style={styles.caption}>{dates.from || 'Any start date'} → {dates.to || 'Today'}</Text> : null}
              <ErrorNotice error={dateError} />
              <Button title="Apply search" secondary onPress={submitSearch} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
              {statuses.map(({ value, label }) => (
                <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: status === value }}
                  style={[s.filter, status === value && s.filterActive]} onPress={() => { setStatus(value); setPage(1); }}>
                  <Text style={[s.filterText, status === value && s.filterTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <ErrorNotice error={query.error} />
            {query.isPending && <Loading />}
            {query.error && (
              <Button
                title="Retry loading orders"
                onPress={() => {
                  void query.refetch();
                }}
              />
            )}
          </View>
        }
        ListEmptyComponent={
          !query.isPending && !query.error ? (
            <View style={styles.card}>
              <Text style={styles.title}>No matching orders</Text>
              <Text style={styles.sub}>Try another buyer, order code, or dispatch status.</Text>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => {
          const current = orderStatus(item.status);
          return (
            <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.code}, ${item.customerName}, ${current.label}`}
              onPress={() => router.push({ pathname: '/orders/[id]', params: { id: item._id } })}
              style={({ pressed }) => [styles.card, pressed && styles.disabled]}>
              <View style={styles.row}>
                <View style={styles.pair}>
                  <Text style={styles.title}>{item.customerName}</Text>
                  <Text style={styles.caption}>{item.code} · {formatDateTime(item.createdAt)}</Text>
                </View>
                <Text style={[styles.chip, { color: current.text, backgroundColor: current.fill }]}>{current.label}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.caption}>{item.items.reduce((sum, line) => sum + line.qty, 0)} units · {item.items.length} material lines</Text>
                <DeskIcon name="chevron" color={colors.muted} size={16} />
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={query.data ? <Pager page={page} limit={query.data.limit} total={query.data.total} change={setPage} /> : undefined}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  dateToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  filters: { gap: 8 },
  filter: { minHeight: 44, borderRadius: 4, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, justifyContent: 'center' },
  filterActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { color: colors.ink, fontWeight: '700' },
  filterTextActive: { color: colors.surface },
});
