import { useState } from 'react';
import { Share, Text, View } from 'react-native';
import { Button, ErrorNotice, PageIntro, Screen, colors, styles } from '../../components/ui';
import { money } from '../admin/data';
import type { StaffOrder } from '../../lib/api';
import { formatDateTime, orderStatus } from './orderDisplay';

export function OrderSummary({ order, factory, close }: { order: StaffOrder; factory: string; close: () => void }) {
  const [error, setError] = useState<Error | null>(null);
  const [sharing, setSharing] = useState(false);
  const status = orderStatus(order.status).label;
  const total = order.subtotalPaise === undefined ? undefined : money(order.subtotalPaise);

  async function share() {
    setError(null);
    setSharing(true);
    try {
      const lines = order.items.map((item) =>
        `${item.name} (${item.sku}) · ${item.qty} units${item.unitPricePaise === undefined ? '' : ` · ${money(item.unitPricePaise)} / unit`}`,
      );
      await Share.share({
        title: `Order ${order.code}`,
        message: [
          factory, `Order summary · ${order.code}`, formatDateTime(order.createdAt),
          `Buyer: ${order.customerName}`, `Status: ${status}`, '',
          ...lines, ...(total ? ['', `Order value: ${total}`] : []),
        ].join('\n'),
      });
    } catch {
      setError(new Error('Could not open the share sheet. Try again.'));
    } finally {
      setSharing(false);
    }
  }

  return (
    <Screen footer={<Button title={sharing ? 'Opening share sheet…' : 'Share order summary'} disabled={sharing} onPress={() => { void share(); }} />}>
      <PageIntro title="Order preview" />
      <View style={[styles.card, { padding: 0, gap: 0, overflow: 'hidden' }]}>
        <View style={{ borderBottomWidth: 2, borderBottomColor: colors.ink, padding: 16, gap: 5 }}>
          <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '700' }}>ORDER SUMMARY</Text>
          <Text style={{ color: colors.ink, fontSize: 23, fontWeight: '800' }}>{factory}</Text>
          <Text style={{ color: colors.muted }}>{order.code} · {formatDateTime(order.createdAt)}</Text>
        </View>
        <View style={{ padding: 14, gap: 12 }}>
          <View style={styles.row}>
            <View style={styles.pair}>
              <Text style={styles.caption}>Buyer</Text>
              <Text style={styles.title}>{order.customerName}</Text>
            </View>
            <Text style={styles.chip}>{status}</Text>
          </View>
          <View style={styles.divider} />
          {order.items.map((item) => (
            <View key={item.productId} style={styles.row}>
              <View style={styles.pair}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.caption}>{item.sku} · {item.qty} units</Text>
              </View>
              {item.unitPricePaise !== undefined && <Text style={styles.title}>{money(item.qty * item.unitPricePaise)}</Text>}
            </View>
          ))}
          {total && <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.ink, paddingTop: 12 }]}>
            <Text style={styles.title}>Order value</Text>
            <Text style={styles.amount}>{total}</Text>
          </View>}
        </View>
      </View>
      <ErrorNotice error={error} />
      <Button title="Back to order" secondary onPress={close} />
    </Screen>
  );
}
