import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type StaffOrder } from '../../../lib/api';
import { Button, ErrorNotice, PageIntro, Screen, styles } from '../../../components/ui';
import { Field, MaterialPicker } from '../../../features/admin/Controls';
import { money, useMaterials, type Material } from '../../../features/admin/data';

type Line = { material: Material; quantity: string };
type OrderInput = {
  customerName: string;
  customerPhone: string;
  channel: 'other';
  items: { productId: string; qty: number }[];
};

export default function NewOrder() {
  const model = useMaterials();
  const client = useQueryClient();
  const [buyer, setBuyer] = useState('');
  const [phone, setPhone] = useState('');
  const [picking, setPicking] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [validation, setValidation] = useState<Error | null>(null);
  const previous = useRef<{ fingerprint: string; key: string } | null>(null);
  const submitting = useRef(false);
  const mutation = useMutation({
    mutationFn: ({ body, key }: { body: OrderInput; key: string }) =>
      api<StaffOrder>('/orders', { method: 'POST', body, key }),
    onSuccess: (order) => {
      void client.invalidateQueries({ queryKey: ['orders'] });
      void client.invalidateQueries({ queryKey: ['products'] });
      void client.invalidateQueries({ queryKey: ['movements'] });
      void client.invalidateQueries({ queryKey: ['dashboard'] });
      router.replace({ pathname: '/orders/[id]', params: { id: order._id } });
    },
    onSettled: () => { submitting.current = false; },
  });
  const subtotal = lines.reduce((total, { material, quantity }) =>
    total + material.pricePaise * (/^\d{1,3}$/.test(quantity) ? Number(quantity) : 0), 0);

  function add(material: Material) {
    if (lines.some((line) => line.material._id === material._id)) {
      setValidation(new Error('This material is already on the order. Edit its quantity above.'));
      return;
    }
    if (lines.length >= 50) {
      setValidation(new Error('An order can contain up to 50 materials.'));
      return;
    }
    setValidation(null);
    setLines([...lines, { material, quantity: '1' }]);
    setPicking(false);
  }

  function submit() {
    if (submitting.current) return;
    if (!buyer.trim() || !/^[6-9]\d{9}$/.test(phone.trim()) || !lines.length ||
      lines.some(({ quantity }) => !/^\d{1,3}$/.test(quantity) || Number(quantity) < 1)) {
      setValidation(new Error('Enter a buyer name, a ten-digit Indian mobile number, and at least one material with 1–999 units.'));
      return;
    }
    setValidation(null);
    const body: OrderInput = {
      customerName: buyer.trim(),
      customerPhone: phone.trim(),
      channel: 'other',
      items: lines.map(({ material, quantity }) => ({ productId: material._id, qty: Number(quantity) })),
    };
    const fingerprint = JSON.stringify(body);
    if (previous.current?.fingerprint !== fingerprint) previous.current = { fingerprint, key: randomUUID() };
    submitting.current = true;
    mutation.mutate({ body, key: previous.current.key });
  }

  if (picking) {
    return (
      <Screen key="materials" footer={<Button title="Back to order draft" secondary onPress={() => setPicking(false)} />}>
        <PageIntro title="Add material" description="Choose a catalog item to add to the order." />
        <ErrorNotice error={validation} />
        <MaterialPicker model={model} action="Add" selected={lines.map((line) => line.material._id)} select={add} />
      </Screen>
    );
  }
  return (
    <Screen key="draft" footer={
      <>
        <View style={styles.row}>
          <Text style={styles.caption}>Estimated order value</Text>
          <Text style={styles.amount}>{money(subtotal)}</Text>
        </View>
        <Button title={mutation.isPending ? 'Creating order…' : 'Create order and reserve stock'} onPress={submit} disabled={mutation.isPending} />
      </>
    }>
      <PageIntro title="New buyer order" description="Add a buyer and the materials to reserve." />
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>Buyer details</Text>
        <Field label="Buyer or company name" value={buyer} onChangeText={setBuyer} maxLength={100} editable={!mutation.isPending} />
        <Field label="Buyer mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} editable={!mutation.isPending} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>Materials · {lines.length}</Text>
      {lines.map(({ material, quantity }) => (
        <View key={material._id} style={styles.card}>
          <Text style={styles.title}>{material.name} · {material.sku}</Text>
          <Text style={styles.sub}>{money(material.pricePaise)} per unit</Text>
          <Field
            label={`Units of ${material.sku}`}
            value={quantity}
            onChangeText={(value) => setLines((current) => current.map((line) =>
              line.material._id === material._id ? { ...line, quantity: value } : line,
            ))}
            keyboardType="number-pad"
            maxLength={3}
            editable={!mutation.isPending}
          />
          <Button title={`Remove ${material.sku}`} secondary disabled={mutation.isPending} onPress={() => {
            setLines((current) => current.filter((line) => line.material._id !== material._id));
          }} />
        </View>
      ))}
      <ErrorNotice error={validation ?? mutation.error} />
      <Button title="Add material" secondary disabled={mutation.isPending} onPress={() => { setValidation(null); setPicking(true); }} />
    </Screen>
  );
}
