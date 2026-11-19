import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type StaffOrder } from '../../../lib/api';
import { nextPackingStatus } from '../../../lib/packing.mjs';
import { Screen, Button, ErrorNotice, Loading, styles } from '../../../components/ui';
export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['orders', id],
    queryFn: () => api<StaffOrder>(`/orders/${id}`),
  });
  const mutation = useMutation({
    mutationFn: (to: string) => api(`/orders/${id}/status`, { method: 'PATCH', body: { to } }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['orders'] }),
    onError: () => client.invalidateQueries({ queryKey: ['orders', id] }),
  });
  const order = query.data;
  const next = order ? nextPackingStatus(order.status) : null;
  return (
    <Screen>
      {query.isPending && <Loading />}
      <ErrorNotice error={query.error} />
      {query.error && (
        <Button
          title="Retry"
          onPress={() => {
            void query.refetch();
          }}
        />
      )}
      {order && (
        <>
          <View style={styles.row}>
            <Text style={styles.heading}>{order.code}</Text>
            <Text style={styles.badge}>{order.status}</Text>
          </View>
          <Text style={styles.sub}>
            {order.customerName} · {order.channel}
          </Text>
          <Text style={styles.eyebrow}>PICK THESE ITEMS</Text>
          {order.items.map((item) => (
            <View key={item.productId} style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.sub}>{item.sku}</Text>
                </View>
                <Text style={styles.heading}>×{item.qty}</Text>
              </View>
            </View>
          ))}
          <ErrorNotice error={mutation.error} />
          {next ? (
            <Button
              title={mutation.isPending ? 'Updating parcel…' : `Mark ${next}`}
              disabled={mutation.isPending}
              onPress={() => {
                if (!mutation.isPending) mutation.mutate(next);
              }}
            />
          ) : (
            <Text style={styles.sub}>
              This parcel is {order.status}. No packing action is needed.
            </Text>
          )}
          <Text style={styles.eyebrow}>PARCEL HISTORY</Text>
          {order.statusHistory.map((entry, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.sub}>{entry.status}</Text>
              <Text style={styles.sub}>
                {new Date(entry.at).toLocaleString('en-IN', {
                  timeZone: 'Asia/Calcutta',
                  day: 'numeric',
                  month: 'short',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}
