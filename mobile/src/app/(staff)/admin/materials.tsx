import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Button, ErrorNotice, PageIntro, Screen, styles } from '../../../components/ui';
import { Field, MaterialPicker } from '../../../features/admin/Controls';
import { priceInPaise, useMaterials, type Material } from '../../../features/admin/data';

export default function Materials() {
  const model = useMaterials();
  const client = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [threshold, setThreshold] = useState('5');
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState<Error | null>(null);

  type Change =
    | { method: 'DELETE'; id: string }
    | { method: 'POST' | 'PATCH'; id?: string; body: {
      name: string; sku: string; pricePaise: number; lowStockThreshold: number;
    } };
  const mutation = useMutation({
    mutationFn: (change: Change) => api(
      change.id ? `/products/${change.id}` : '/products',
      change.method === 'DELETE' ? { method: 'DELETE' } : { method: change.method, body: change.body },
    ),
    onSuccess: (_, change) => {
      load(null);
      setEditorOpen(false);
      setMessage(change.method === 'DELETE' ? 'Material archived.' : 'Material saved.');
      void client.invalidateQueries({ queryKey: ['products'] });
      void client.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
  function load(material: Material | null) {
    setEditing(material);
    setName(material?.name ?? '');
    setSku(material?.sku ?? '');
    setPrice(material ? (material.pricePaise / 100).toFixed(2) : '');
    setThreshold(String(material?.lowStockThreshold ?? 5));
    setValidation(null);
    setMessage('');
  }
  function save() {
    const pricePaise = priceInPaise(price);
    const lowStockThreshold = Number(threshold);
    if (!name.trim() || !/^[A-Za-z0-9_-]{1,40}$/.test(sku.trim()) || pricePaise === null ||
      !/^\d+$/.test(threshold) || lowStockThreshold > 1000000) {
      setValidation(new Error('Enter a grade name, a valid SKU, a rupee price with up to two decimals, and a whole number stock threshold.'));
      return;
    }
    setValidation(null);
    setMessage('');
    mutation.mutate({
      method: editing ? 'PATCH' : 'POST',
      id: editing?._id,
      body: { name: name.trim(), sku: sku.trim(), pricePaise, lowStockThreshold },
    });
  }
  function archive(material: Material) {
    Alert.alert('Archive material?', `${material.name} will be removed from the active catalog.`, [
      { text: 'Keep material', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => {
        setMessage('');
        setValidation(null);
        mutation.mutate({ method: 'DELETE', id: material._id });
      } },
    ]);
  }

  if (editorOpen) {
    return (
      <Screen key="editor" footer={<Button title={mutation.isPending ? 'Saving…' : 'Save material'} onPress={save} disabled={mutation.isPending} />}>
        <PageIntro title={editing ? 'Edit material' : 'New material'} description={editing ? `${editing.sku} · ${editing.stock} units available` : 'Add a material grade to your factory catalog.'} />
        <View style={styles.card}>
          <Text style={styles.title}>Material details</Text>
          <Field label="Material grade" value={name} onChangeText={setName} maxLength={100} editable={!mutation.isPending} />
          <Field label="SKU" value={sku} onChangeText={setSku} autoCapitalize="characters" autoCorrect={false} maxLength={40} editable={!mutation.isPending} />
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Price and stock policy</Text>
          <Field label="Unit price (₹)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" maxLength={10} editable={!mutation.isPending} />
          <Field label="Low stock threshold (units)" value={threshold} onChangeText={setThreshold} keyboardType="number-pad" maxLength={7} editable={!mutation.isPending} />
        </View>
        <ErrorNotice error={validation ?? mutation.error} />
        {editing && <Button title="Archive material" secondary disabled={mutation.isPending} onPress={() => archive(editing)} />}
        <Button title="Back to catalog" secondary disabled={mutation.isPending} onPress={() => { mutation.reset(); load(null); setEditorOpen(false); }} />
      </Screen>
    );
  }
  return (
    <Screen key="catalog" footer={<Button title="Add material" onPress={() => { mutation.reset(); load(null); setEditorOpen(true); }} />}>
      <PageIntro title="Material catalog" description="Manage grades, SKUs, prices and low stock thresholds." />
      {message ? <Text accessibilityRole="alert" style={styles.chip}>{message}</Text> : null}
      <MaterialPicker model={model} action="Edit" select={(material) => {
        mutation.reset();
        load(material);
        setEditorOpen(true);
      }} />
    </Screen>
  );
}
