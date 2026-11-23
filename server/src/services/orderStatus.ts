import { transaction } from '../db/pool';
import { Order, type OrderStatus } from '../db/store';
import { AppError } from '../lib/appError';
import type { Actor } from '../middleware/auth';
import { restock } from './stock';
export const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};
export async function changeOrderStatus(actor: Actor, id: string, to: OrderStatus) {
  if (actor.role === 'staff' && !['packed', 'shipped'].includes(to))
    throw new AppError(403, 'FORBIDDEN', 'Staff may only pack or ship orders');
  return transaction(async (tx) => {
    const current = await Order.findInShop(id, actor.shopId, tx);
    if (!current) throw new AppError(404, 'NOT_FOUND', 'Order not found');
    if (!transitions[current.status].includes(to))
      throw new AppError(
        409,
        'ILLEGAL_TRANSITION',
        'This order has changed. Refresh before trying again.',
      );
    const history = [
      ...current.statusHistory.map((event) => ({
        status: event.status,
        userId: event.userId,
        at: event.at.toISOString(),
      })),
      { status: to, userId: actor.id, at: new Date().toISOString() },
    ];
    const updated = await tx.query(
      `UPDATE orders SET status = $4, status_history = $5::jsonb, updated_at = now()
       WHERE id = $1 AND shop_id = $2 AND status = $3
       RETURNING id`,
      [id, actor.shopId, current.status, to, JSON.stringify(history)],
    );
    if (updated.rowCount !== 1)
      throw new AppError(409, 'ILLEGAL_TRANSITION', 'Another person already updated this order');
    if (to === 'cancelled')
      await restock(
        actor,
        current.items.map((item) => ({ productId: item.productId, qty: item.qty })),
        current._id,
        tx,
      );
    const changed = await Order.findInShop(id, actor.shopId, tx);
    if (!changed) throw new AppError(404, 'NOT_FOUND', 'Order not found');
    return changed;
  });
}
