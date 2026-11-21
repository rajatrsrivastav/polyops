import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type FactoryProfile, type StaffOrder } from '../../../lib/api';
import { nextPackingStatus } from '../../../lib/packing.mjs';
import { Screen, Button, ErrorNotice, Loading, PageIntro, colors, styles } from '../../../components/ui';
import { money } from '../../../features/admin/data';
import { formatDateTime, orderStatus } from '../../../features/desk/orderDisplay';
import { OrderSummary } from '../../../features/desk/OrderSummary';
export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useQueryClient();
  const [preview, setPreview] = useState(false);
  const query = useQuery({
    queryKey: ['orders', id],
    queryFn: () => api<StaffOrder>(`/orders/${id}`),
  });
  const mutation = useMutation({
    mutationFn: (to: string) => api(`/orders/${id}/status`, { method: 'PATCH', body: { to } }),
    onSuccess: async (_, to) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['orders'] }),
        client.invalidateQueries({ queryKey: ['dashboard'] }),
        ...(to === 'cancelled' ? [
          client.invalidateQueries({ queryKey: ['products'] }),
          client.invalidateQueries({ queryKey: ['movements'] }),
        ] : []),
      ]);
    },
    onError: () => client.invalidateQueries({ queryKey: ['orders', id] }),
  });
  const profile = useQuery({ queryKey: ['me'], queryFn: () => api<FactoryProfile>('/me') });
  const order = query.data;
  const isAdmin = profile.data?.role === 'owner';
  const canCancel = isAdmin && (order?.status === 'pending' || order?.status === 'packed');
  const next = order?.status === 'shipped' && isAdmin
    ? 'delivered'
    : order ? nextPackingStatus(order.status) : null;
  if (order && isAdmin && preview) {
    return <OrderSummary order={order} factory={profile.data?.shopName ?? 'PolyOps'} close={() => setPreview(false)} />;
  }
  const status = order ? orderStatus(order.status) : null;
  return (
    <Screen footer={next ? (
      <Button title={mutation.isPending ? 'Updating order…' : `Mark ${orderStatus(next).label.toLowerCase()}`}
        disabled={mutation.isPending} onPress={() => mutation.mutate(next)} />
    ) : undefined}>
      {query.isPending && <Loading />}
      <ErrorNotice error={query.error} />
      {query.error && <Button title="Retry" onPress={() => { void query.refetch(); }} />}
      {order && status && (
        <>
          <PageIntro title={order.code} description={formatDateTime(order.createdAt)} />
          <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: colors.accent }]}>
            <View style={styles.row}>
              <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '700' }}>BUYER</Text>
              <Text style={[styles.chip, { color: status.text, backgroundColor: status.fill }]}>{status.label}</Text>
            </View>
            <Text style={[styles.heading, { color: colors.ink }]}>{order.customerName}</Text>
            {isAdmin && order.customerPhone && <Text style={{ color: colors.muted }}>{order.customerPhone}</Text>}
            {isAdmin && order.subtotalPaise !== undefined && (
              <Text style={[styles.amount, { color: colors.ink }]}>{money(order.subtotalPaise)}</Text>
            )}
          </View>
          {isAdmin && <Button title="Preview order summary" secondary onPress={() => setPreview(true)} />}
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.title}>Materials · {order.items.length}</Text>
            {order.items.map((item) => (
              <View key={item.productId} style={styles.row}>
                <View style={styles.pair}>
                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.caption}>
                    {item.sku}{isAdmin && item.unitPricePaise !== undefined ? ` · ${money(item.unitPricePaise)} / unit` : ''}
                  </Text>
                </View>
                <Text style={styles.chip}>×{item.qty}</Text>
              </View>
            ))}
          </View>
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.title}>Dispatch history</Text>
            {order.statusHistory.map((entry, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.title}>{orderStatus(entry.status).label}</Text>
                <Text style={styles.caption}>{formatDateTime(entry.at)}</Text>
              </View>
            ))}
          </View>
          <ErrorNotice error={mutation.error} />
          {canCancel && (
            <Button title="Cancel order" secondary disabled={mutation.isPending} onPress={() => {
              Alert.alert('Cancel buyer order?', 'Reserved stock will be returned to inventory.', [
                { text: 'Keep order', style: 'cancel' },
                { text: 'Cancel order', style: 'destructive', onPress: () => mutation.mutate('cancelled') },
              ]);
            }} />
          )}
        </>
      )}
    </Screen>
  );
}
