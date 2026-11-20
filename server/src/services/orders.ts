import { createHash } from 'node:crypto';
import { newId } from '../db/rows';
import { query, transaction, type Sql, type SqlValue } from '../db/pool';
import { likeContains } from '../db/rows';
import {
  Counter,
  Order,
  Product,
  type Channel,
  type OrderDoc,
  type OrderItem,
  type OrderStatus,
} from '../db/store';
import { AppError, isDuplicate } from '../lib/appError';
import { dayStart, istDay, nextDay } from '../lib/time';
import type { Actor } from '../middleware/auth';
import { reserveStock } from './stock';
export type CreateOrderInput = {
  items: { productId: string; qty: number }[];
  channel: Channel;
  customerName: string;
  customerPhone: string;
};
export type OrderQuery = {
  page: number;
  limit: number;
  status?: OrderStatus;
  from?: string;
  to?: string;
  q?: string;
};
const db: Sql = { query };
export async function createOrder(actor: Actor, input: CreateOrderInput, key?: string) {
  const quantities = new Map<string, number>();
  for (const item of input.items)
    quantities.set(
      item.productId.toLowerCase(),
      (quantities.get(item.productId.toLowerCase()) ?? 0) + item.qty,
    );
  const lines = [...quantities]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([productId, qty]) => ({ productId, qty }));
  if (lines.some((item) => item.qty > 999))
    throw new AppError(400, 'VALIDATION_ERROR', 'Combined quantity per product cannot exceed 999');
  const requestHash = createHash('sha256')
    .update(JSON.stringify({ ...input, items: lines }))
    .digest('hex');
  const existing = async () => {
    const order = key ? await Order.findByIdempotency(actor.shopId, key) : null;
    if (order && order.requestHash !== requestHash)
      throw new AppError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'This retry key was already used for a different order',
      );
    return order;
  };
  const cached = await existing();
  if (cached) return cached;
  try {
    await Counter.ensure(actor.shopId);
  } catch (error) {
    if (!isDuplicate(error)) throw error;
  }
  try {
    return await transaction(async (tx) => {
      if (key) {
        const retry = await Order.findByIdempotency(actor.shopId, key, tx);
        if (retry) {
          if (retry.requestHash !== requestHash)
            throw new AppError(
              409,
              'IDEMPOTENCY_CONFLICT',
              'This retry key was already used for a different order',
            );
          return retry;
        }
      }
      const products = await Product.findByIds(
        actor.shopId,
        lines.map((item) => item.productId),
        true,
        tx,
      );
      const catalog = new Map(products.map((product) => [product._id, product]));
      const items = lines.map((line) => {
        const product = catalog.get(line.productId);
        if (!product)
          throw new AppError(409, 'INSUFFICIENT_STOCK', 'An ordered product is unavailable');
        return {
          productId: product._id,
          qty: line.qty,
          sku: product.sku,
          name: product.name,
          unitPricePaise: product.pricePaise,
        };
      });
      const subtotalPaise = items.reduce((total, item) => total + item.qty * item.unitPricePaise, 0);
      if (!Number.isSafeInteger(subtotalPaise))
        throw new AppError(400, 'VALIDATION_ERROR', 'Order total exceeds supported amount');
      const seq = await Counter.next(actor.shopId, tx);
      if (seq === null) throw new AppError(500, 'INTERNAL', 'Order sequence unavailable');
      const orderId = newId();
      await reserveStock(actor, items, orderId, tx);
      return Order.create(
        {
          _id: orderId,
          shopId: actor.shopId,
          code: `MC-${String(seq).padStart(4, '0')}`,
          items,
          channel: input.channel,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          subtotalPaise,
          status: 'pending',
          statusHistory: [{ status: 'pending', at: new Date(), userId: actor.id }],
          ...(key ? { idempotencyKey: key, requestHash } : {}),
        },
        tx,
      );
    });
  } catch (error) {
    if (key && isDuplicate(error)) {
      const saved = await existing();
      if (saved) return saved;
    }
    throw error;
  }
}
export function publicOrder(order: OrderDoc, role: Actor['role']) {
  if (role === 'staff') {
    return {
      _id: order._id,
      code: order.code,
      customerName: order.customerName,
      channel: order.channel,
      status: order.status,
      createdAt: order.createdAt,
      statusHistory: order.statusHistory,
      items: order.items.map((item) => ({
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        qty: item.qty,
      })),
    };
  }
  return {
    _id: order._id,
    shopId: order.shopId,
    code: order.code,
    items: order.items,
    channel: order.channel,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    subtotalPaise: order.subtotalPaise,
    status: order.status,
    statusHistory: order.statusHistory,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
export async function getOrder(actor: Actor, id: string) {
  const order = await Order.findInShop(id, actor.shopId);
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');
  return publicOrder(order, actor.role);
}
function orderWhere(actor: Actor, input: OrderQuery) {
  const params: SqlValue[] = [actor.shopId];
  const where = ['shop_id = $1'];
  const today = istDay();
  if (input.status) {
    params.push(input.status);
    where.push(`status = $${params.length}`);
  } else if (actor.role === 'staff') where.push(`status IN ('pending', 'packed')`);
  if (input.from || input.to || actor.role === 'staff') {
    params.push(dayStart(input.from ?? (actor.role === 'staff' ? today : '2000-01-01')));
    where.push(`created_at >= $${params.length}`);
    params.push(nextDay(input.to ?? today));
    where.push(`created_at < $${params.length}`);
  }
  if (input.q) {
    params.push(likeContains(input.q));
    where.push(
      `(code ILIKE $${params.length} ESCAPE '\\' OR customer_name ILIKE $${params.length} ESCAPE '\\')`,
    );
  }
  return { where: where.join(' AND '), params };
}
export async function listOrders(actor: Actor, input: OrderQuery) {
  const filter = orderWhere(actor, input);
  const totalRow = await db.query(
    `SELECT COUNT(*)::bigint AS total FROM orders WHERE ${filter.where}`,
    filter.params,
  );
  const total = Number(totalRow.rows[0]?.total ?? 0);
  const listed = await db.query(
    `SELECT id, shop_id, code, items, channel, customer_name, customer_phone, subtotal_paise, status,
            idempotency_key, request_hash, status_history, created_at, updated_at
     FROM orders WHERE ${filter.where}
     ORDER BY created_at DESC, id DESC
     LIMIT $${filter.params.length + 1} OFFSET $${filter.params.length + 2}`,
    [...filter.params, input.limit, (input.page - 1) * input.limit],
  );
  const items = [];
  for (const row of listed.rows) {
    const found = await Order.findById(String(row.id));
    if (found) items.push(publicOrder(found, actor.role));
  }
  return { items, total, page: input.page, limit: input.limit };
}
export type { OrderItem };
