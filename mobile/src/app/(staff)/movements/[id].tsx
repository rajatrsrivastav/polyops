import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api, type Page, type StockMovement } from '../../../lib/api';
import { Button, ErrorNotice, Loading, PageIntro, Screen, colors, styles } from '../../../components/ui';

import { Pager } from '../../../components/inventory';
import { formatDateTime } from '../../../features/desk/orderDisplay';
const movementLabel = {
  receive: 'Stock received',
  reserve: 'Reserved for order',
  restock: 'Returned to stock',
};

export default function Movements() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['movements', id, page],
    queryFn: () => api<Page<StockMovement>>(`/products/${encodeURIComponent(id)}/movements?page=${page}`),
  });

  return (
    <Screen>
      <PageIntro title={name || 'Stock movements'} description="Stock ledger" />
      {query.isPending && <Loading />}
      <ErrorNotice error={query.error} />
      {query.error && <Button title="Retry" onPress={() => { void query.refetch(); }} />}
      {query.data?.total === 0 && <Text style={styles.sub}>No movements recorded for this material.</Text>}
      {query.data?.items.map((movement) => (
        <View key={movement._id} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.pair}>
              <Text style={styles.title}>{movementLabel[movement.type]}</Text>
              <Text style={styles.caption}>{formatDateTime(movement.createdAt)}</Text>
            </View>
            <Text style={[styles.chip, movement.type === 'reserve' && { backgroundColor: colors.clay, color: colors.ink }]}>
              {movement.type === 'reserve' ? '−' : '+'}{movement.qty}
            </Text>
          </View>
          {movement.note ? <Text style={styles.sub}>{movement.note}</Text> : null}
          <Text style={styles.caption}>Balance after movement · {movement.balanceAfter} units</Text>
        </View>
      ))}
      {query.data && <Pager page={page} limit={query.data.limit} total={query.data.total} change={setPage} />}
    </Screen>
  );
}
