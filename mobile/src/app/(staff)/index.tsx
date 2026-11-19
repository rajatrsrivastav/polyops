import { useState } from 'react';
import { FlatList, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useQuery } from '@tanstack/react-query';
import { api, type Page, type StaffOrder } from '../../lib/api';
import { auth } from '../../lib/firebase';
import { Button, ErrorNotice, Loading, styles } from '../../components/ui';
export default function PickList() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['orders', 'today', page],
    queryFn: () => api<Page<StaffOrder>>(`/orders?page=${page}`),
  });
  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <FlatList
        data={query.data?.items ?? []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.content}
        refreshing={query.isRefetching}
        onRefresh={() => {
          void query.refetch();
        }}
        ListHeaderComponent={
          <View style={{ gap: 18 }}>
            <Text style={styles.eyebrow}>TODAY · INDIA TIME</Text>
            <Text style={styles.heading}>A fresh stack of possibilities.</Text>
            <Text style={styles.sub}>Today’s pending and packed orders. Pull down to refresh.</Text>
            <Button title="Receive a delivery" secondary onPress={() => router.push('/receive')} />
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
              <Text style={styles.title}>All clear for today.</Text>
              <Text style={styles.sub}>New pending orders will appear here after you refresh.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.code}, ${item.customerName}, ${item.status}`}
            onPress={() => router.push({ pathname: '/orders/[id]', params: { id: item._id } })}
            style={({ pressed }) => [styles.card, pressed && styles.disabled]}
          >
            <View style={styles.row}>
              <Text style={styles.title}>{item.code}</Text>
              <Text style={styles.badge}>{item.status}</Text>
            </View>
            <Text style={styles.sub}>{item.customerName}</Text>
            <Text style={styles.sub}>
              {item.items.reduce((sum, line) => sum + line.qty, 0)} units · {item.channel}
            </Text>
            <Text style={styles.sub}>
              {item.items.map((line) => `${line.qty} × ${line.name}`).join('\n')}
            </Text>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={{ gap: 14 }}>
            {query.data && (
              <>
                <Text style={styles.sub}>
                  {query.data.total} orders · Page {page}
                </Text>
                <View style={styles.row}>
                  <Button
                    title="Previous"
                    secondary
                    disabled={page === 1}
                    onPress={() => setPage(page - 1)}
                  />
                  <Button
                    title="Next"
                    secondary
                    disabled={page * 20 >= query.data.total}
                    onPress={() => setPage(page + 1)}
                  />
                </View>
              </>
            )}
            <Button
              title="Sign out"
              secondary
              onPress={() => {
                if (auth) void signOut(auth);
              }}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
