import { useRef, useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { api, type Page, type StaffProduct } from '../../lib/api';
import { deliveryRequest } from '../../lib/packing.mjs';
import { Screen, Button, ErrorNotice, Loading, styles } from '../../components/ui';
export default function Receive() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [product, setProduct] = useState<StaffProduct | null>(null);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['products', q, page],
    queryFn: () => api<Page<StaffProduct>>(`/products?q=${encodeURIComponent(q)}&page=${page}`),
  });
  const mutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error('Select a product');
      const request = deliveryRequest(retry, product._id, Number(qty), note, randomUUID);
      return api(`/products/${product._id}/movements`, {
        method: 'POST',
        body: request.body,
        key: request.key,
      });
    },
    onSuccess: async () => {
      setSaved(true);
      setQty('');
      setNote('');
      retry.current = null;
      await client.invalidateQueries({ queryKey: ['products'] });
    },
  });
  const valid = Number.isInteger(Number(qty)) && Number(qty) >= 1 && Number(qty) <= 99999;
  return (
    <Screen>
      <Text style={styles.heading}>Fresh on the shelf.</Text>
      <Text style={styles.sub}>Find a product, count the new units, and record the delivery.</Text>
      <View>
        <Text style={styles.label}>Find a name or SKU</Text>
        <TextInput
          accessibilityLabel="Search products by name or SKU"
          style={styles.input}
          value={search}
          onChangeText={setSearch}
          maxLength={100}
          returnKeyType="search"
          onSubmitEditing={() => {
            setQ(search);
            setPage(1);
          }}
        />
      </View>
      <Button
        title="Find product"
        secondary
        onPress={() => {
          setQ(search);
          setPage(1);
        }}
      />
      <ErrorNotice error={query.error} />
      {query.isPending && <Loading />}
      {query.error && (
        <Button
          title="Retry loading products"
          onPress={() => {
            void query.refetch();
          }}
        />
      )}
      {query.data?.items.length === 0 && (
        <Text style={styles.sub}>No matching products. Try another name or SKU.</Text>
      )}
      {query.data?.items.map((item) => (
        <Pressable
          key={item._id}
          accessibilityRole="radio"
          accessibilityState={{ selected: product?._id === item._id }}
          accessibilityLabel={`${item.name}, ${item.sku}, ${item.stock} in stock`}
          style={[
            styles.card,
            product?._id === item._id && { borderColor: '#1B3A4B', borderWidth: 2 },
          ]}
          onPress={() => {
            setProduct(item);
            setSaved(false);
          }}
        >
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.sub}>
            {item.sku} · {item.stock} on shelf{product?._id === item._id ? ' · Selected' : ''}
          </Text>
        </Pressable>
      ))}
      {query.data && (
        <View style={styles.row}>
          <Button
            title="Previous"
            secondary
            disabled={page === 1}
            onPress={() => setPage(page - 1)}
          />
          <Text style={styles.sub}>Page {page}</Text>
          <Button
            title="Next"
            secondary
            disabled={page * 20 >= query.data.total}
            onPress={() => setPage(page + 1)}
          />
        </View>
      )}
      {product && (
        <View style={styles.card}>
          <Text style={styles.title}>Receive · {product.name}</Text>
          <View>
            <Text style={styles.label}>New units received</Text>
            <TextInput
              accessibilityLabel="New units received"
              style={styles.input}
              keyboardType="number-pad"
              value={qty}
              onChangeText={(value) => {
                setQty(value);
                setSaved(false);
              }}
              maxLength={5}
            />
          </View>
          <View>
            <Text style={styles.label}>Delivery note (optional)</Text>
            <TextInput
              accessibilityLabel="Delivery note, optional"
              style={styles.input}
              value={note}
              onChangeText={setNote}
              maxLength={200}
            />
          </View>
          <ErrorNotice error={mutation.error} />
          {saved && (
            <Text style={styles.sub} accessibilityRole="alert">
              Delivery recorded. The stock ledger is up to date.
            </Text>
          )}
          <Button
            title={mutation.isPending ? 'Recording delivery…' : 'Record delivery'}
            disabled={!valid || mutation.isPending}
            onPress={() => {
              if (!mutation.isPending) mutation.mutate();
            }}
          />
        </View>
      )}
    </Screen>
  );
}
