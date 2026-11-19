import mongoose from 'mongoose';
import { Order, type OrderStatus } from '../models';
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
  return mongoose.connection.transaction(async (session) => {
    const current = await Order.findOne({ _id: id, shopId: actor.shopId }).session(session);
    if (!current) throw new AppError(404, 'NOT_FOUND', 'Order not found');
    if (!transitions[current.status].includes(to))
      throw new AppError(
        409,
        'ILLEGAL_TRANSITION',
        'This order has changed. Refresh before trying again.',
      );
    const changed = await Order.findOneAndUpdate(
      { _id: id, shopId: actor.shopId, status: current.status },
      {
        $set: { status: to },
        $push: { statusHistory: { status: to, at: new Date(), userId: actor.id } },
      },
      { returnDocument: 'after', session },
    );
    if (!changed)
      throw new AppError(409, 'ILLEGAL_TRANSITION', 'Another person already updated this order');
    if (to === 'cancelled') await restock(actor, current.items, current._id, session);
    return changed;
  });
}
