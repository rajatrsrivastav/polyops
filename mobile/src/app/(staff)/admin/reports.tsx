import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Button, displayFamily, ErrorNotice, Loading, PageIntro, Screen, colors, styles } from '../../../components/ui';
import { money, type Dashboard } from '../../../features/admin/data';

const periods = [{ value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }] as const;
type Report = 'daily' | 'materials';

export default function Reports() {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [tab, setTab] = useState<Report>('daily');
  const query = useQuery({
    queryKey: ['dashboard', range],
    queryFn: () => api<Dashboard>(`/dashboard?range=${range}`),
  });
  const data = query.data;
  const peak = Math.max(1, ...(data?.salesByDay.map((row) => row.revenuePaise) ?? []));
  return (
    <Screen>
      <PageIntro title="Operations reports" description="Track order activity and material demand." />
      <View style={s.segment}>
        {periods.map(({ value, label }) => (
          <Segment key={value} label={label} selected={range === value} onPress={() => setRange(value)} />
        ))}
      </View>
      {query.isPending && <Loading />}
      <ErrorNotice error={query.error} />
      {query.error && <Button title="Retry reports" onPress={() => void query.refetch()} />}
      {data && (
        <>
          <View style={s.hero}>
            <Text style={s.light}>Order value · last {range === '7d' ? 7 : 30} days</Text>
            <Text style={s.figure}>{money(data.summary.revenuePaise)}</Text>
            <Text style={s.light}>Excludes cancelled orders</Text>
          </View>
          <View style={s.metrics}>
            <Metric label="Orders" value={data.summary.orderCount} />
            <Metric label="Units" value={data.summary.units} />
            <Metric label="Open orders" value={data.summary.pendingCount} />
          </View>
          <Text style={styles.caption}>Open orders includes all dates.</Text>
          <View style={s.segment}>
            <Segment label="Daily activity" selected={tab === 'daily'} onPress={() => setTab('daily')} />
            <Segment label="Materials" selected={tab === 'materials'} onPress={() => setTab('materials')} />
          </View>
          {tab === 'daily' ? (
            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.title}>Daily order value</Text>
              {data.salesByDay.map((day) => (
                <View key={day.day} style={s.daily}>
                  <View style={styles.row}>
                    <Text style={styles.caption}>{day.day} · {day.orderCount} orders</Text>
                    <Text style={styles.title}>{money(day.revenuePaise)}</Text>
                  </View>
                  <View style={s.track} accessible={false}>
                    <View style={[s.bar, { width: `${day.revenuePaise * 100 / peak}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text accessibilityRole="header" style={styles.title}>Low stock</Text>
                {!data.lowStock.length && <Text style={styles.sub}>No materials below their stock threshold.</Text>}
                {data.lowStock.map((item) => (
                  <View key={item._id} style={styles.row}>
                    <View style={styles.pair}><Text style={styles.title}>{item.name}</Text><Text style={styles.caption}>{item.sku}</Text></View>
                    <Text style={styles.chip}>{item.stock} left</Text>
                  </View>
                ))}
              </View>
              <View style={styles.card}>
                <Text accessibilityRole="header" style={styles.title}>Top ordered materials</Text>
                {!data.topSkus.length && <Text style={styles.sub}>No orders in this period.</Text>}
                {data.topSkus.map((item) => (
                  <View key={item._id} style={styles.row}>
                    <View style={styles.pair}><Text style={styles.title}>{item.name}</Text><Text style={styles.caption}>{item.qty} units</Text></View>
                    <Text style={styles.title}>{money(item.revenuePaise)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}
      <Button title="Open weekly brief" secondary onPress={() => router.push('/admin/brief')} />
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.metric}>
      <Text style={styles.caption}>{label}</Text>
      <Text style={styles.amount}>{value}</Text>
    </View>
  );
}

function Segment({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={[s.tab, selected && s.tabActive]}>
      <Text style={[s.tabLabel, selected && { color: colors.surface }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  hero: { borderBottomColor: colors.line, borderBottomWidth: 1, paddingVertical: 14, gap: 5 },
  light: { color: colors.muted, fontSize: 14 },
  figure: { color: colors.ink, fontFamily: displayFamily, fontSize: 35, fontVariant: ['tabular-nums'] },
  segment: { flexDirection: 'row', gap: 7 },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: colors.surface, paddingHorizontal: 8, borderWidth: 1, borderColor: colors.line },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabLabel: { color: colors.ink, fontSize: 14, textAlign: 'center', fontWeight: '700' },
  metrics: { flexDirection: 'row', alignItems: 'stretch', gap: 7 },
  metric: { flex: 1, paddingHorizontal: 8, paddingVertical: 6, borderLeftWidth: 2, borderLeftColor: colors.highlight, gap: 3 },
  daily: { gap: 4, paddingBottom: 6 },
  track: { height: 6, borderRadius: 4, backgroundColor: colors.wash, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 4, backgroundColor: colors.accent },
});
