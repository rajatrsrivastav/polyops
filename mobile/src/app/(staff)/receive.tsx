import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { api, type Page, type StaffProduct, type StockMovement } from '../../lib/api';
import { deliveryRequest } from '../../lib/packing.mjs';
import { Screen, Button, ErrorNotice, Loading, PageIntro, styles } from '../../components/ui';
import { InventorySearch, MaterialRow, Pager } from '../../components/inventory';
import { Field } from '../../features/admin/Controls';
export default function Receive() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [lowStock, setLowStock] = useState(false);
  const [product, setProduct] = useState<StaffProduct | null>(null);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['products', q, page, lowStock],
    queryFn: () => api<Page<StaffProduct>>(`/products?q=${encodeURIComponent(q)}&page=${page}&lowStock=${lowStock}`),
  });
  const mutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error('Select a product');
      const request = deliveryRequest(retry, product._id, Number(qty), note, randomUUID);
      return api<StockMovement>(`/products/${product._id}/movements`, {
        method: 'POST',
        body: request.body,
        key: request.key,
      });
    },
    onSuccess: async (movement) => {
      setProduct((current) => current && { ...current, stock: movement.balanceAfter });
      setSaved(true);
      setQty('');
      setNote('');
      retry.current = null;
      await Promise.all([
        client.invalidateQueries({ queryKey: ['products'] }),
        client.invalidateQueries({ queryKey: ['movements', product?._id] }),
        client.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
  const valid = /^\d{1,5}$/.test(qty) && Number(qty) > 0;
  if (product) {
    return (
      <Screen key="receipt" footer={<Button title={mutation.isPending ? 'Recording receipt…' : 'Record receipt'} disabled={!valid || mutation.isPending} onPress={() => mutation.mutate()} />}>
        <PageIntro title="Stock receipt" description="Record an inbound delivery against this material." />
        <View style={styles.card}>
          <Text style={styles.eyebrow}>{product.sku}</Text>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.chip}>{product.stock} units available</Text>
          <Button title="View stock movements" secondary disabled={mutation.isPending} onPress={() => {
            router.push({ pathname: '/movements/[id]', params: { id: product._id, name: product.name } });
          }} />
        </View>
        <View style={styles.card}>
          <Field label="Units received" value={qty} onChangeText={(value) => { setQty(value); setSaved(false); }} keyboardType="number-pad" editable={!mutation.isPending} maxLength={5} />
          <Field label="Supplier, lot or weigh slip reference" placeholder="Optional reference" value={note} onChangeText={setNote} editable={!mutation.isPending} maxLength={200} />
          <ErrorNotice error={mutation.error} />
          {saved && <Text accessibilityRole="alert" style={styles.chip}>Receipt recorded</Text>}
        </View>
        <Button title="Back to material stock" secondary disabled={mutation.isPending} onPress={() => {
          setProduct(null);
          setQty('');
          setNote('');
          setSaved(false);
          mutation.reset();
        }} />
      </Screen>
    );
  }
  return (
    <Screen key="stock">
      <PageIntro title="Material stock" description="Select a grade to receive stock or review its movements." />
      <InventorySearch value={search} change={setSearch} submit={() => { setQ(search.trim()); setPage(1); }} />
      <View style={styles.row}>
        <Text style={styles.caption}>{query.data ? `${query.data.total} materials` : 'Inventory'}</Text>
        <Button title={lowStock ? 'Low stock only' : 'Show low stock'} secondary={!lowStock} onPress={() => { setLowStock(!lowStock); setPage(1); }} />
      </View>
      <ErrorNotice error={query.error} />
      {query.isPending && <Loading />}
      {query.error && <Button title="Retry materials" onPress={() => { void query.refetch(); }} />}
      {query.data?.items.length === 0 && <Text style={styles.sub}>No matching materials.</Text>}
      {query.data?.items.map((item) => (
        <MaterialRow key={item._id} item={item} action="Open stock for" select={() => setProduct(item)} />
      ))}
      {query.data && <Pager page={page} limit={query.data.limit} total={query.data.total} change={setPage} />}
    </Screen>
  );
}
