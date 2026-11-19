import mongoose, { Types } from 'mongoose';
import { createHash } from 'node:crypto';
import { Order, Product, Counter, type OrderStatus } from '../models';
import { AppError, isDuplicate } from '../lib/appError';
import { reserveStock } from './stock';
import type { Actor } from '../middleware/auth';
import { dayStart, istDay, nextDay } from '../lib/time';
import { literalSearch } from './products';
export type CreateOrderInput = {
  items: { productId: string; qty: number }[];
  channel: 'instagram' | 'whatsapp' | 'website' | 'other';
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
    const order = key ? await Order.findOne({ shopId: actor.shopId, idempotencyKey: key }) : null;
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
  // Create the counter outside the transaction to avoid competing upserts during first use.
  try {
    await Counter.updateOne(
      { shopId: actor.shopId },
      { $setOnInsert: { seq: 0 } },
      { upsert: true },
    );
  } catch (error) {
    if (!isDuplicate(error)) throw error;
  }
  try {
    return await mongoose.connection.transaction(async (session) => {
      // Read the retry key inside the transaction too: a write conflict can restart this callback.
      if (key) {
        const retry = await Order.findOne({ shopId: actor.shopId, idempotencyKey: key }).session(
          session,
        );
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
      const products = await Product.find({
        _id: { $in: lines.map((item) => new Types.ObjectId(item.productId)) },
        shopId: actor.shopId,
        isActive: true,
      })
        .session(session)
        .lean();
      const catalog = new Map(products.map((product) => [String(product._id), product]));
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
      const subtotalPaise = items.reduce(
        (total, item) => total + item.qty * item.unitPricePaise,
        0,
      );
      if (!Number.isSafeInteger(subtotalPaise))
        throw new AppError(400, 'VALIDATION_ERROR', 'Order total exceeds supported amount');
      const counter = await Counter.findOneAndUpdate(
        { shopId: actor.shopId },
        { $inc: { seq: 1 } },
        { returnDocument: 'after', session },
      );
      if (!counter) throw new AppError(500, 'INTERNAL', 'Order sequence unavailable');
      const orderId = new Types.ObjectId();
      await reserveStock(actor, items, orderId, session);
      const [order] = await Order.create(
        [
          {
            _id: orderId,
            shopId: actor.shopId,
            code: `MC-${String(counter.seq).padStart(4, '0')}`,
            items,
            channel: input.channel,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            subtotalPaise,
            status: 'pending',
            statusHistory: [{ status: 'pending', at: new Date(), userId: actor.id }],
            ...(key ? { idempotencyKey: key, requestHash } : {}),
          },
        ],
        { session },
      );
      if (!order) throw new AppError(500, 'INTERNAL', 'Order could not be created');
      return order;
    });
  } catch (error) {
    if (key && isDuplicate(error)) {
      const saved = await existing();
      if (saved) return saved;
    }
    throw error;
  }
}
export function publicOrder(
  order: NonNullable<Awaited<ReturnType<typeof Order.findOne>>> | Record<string, unknown>,
  role: Actor['role'],
) {
  const value =
    'toObject' in order && typeof order.toObject === 'function' ? order.toObject() : order;
  // Explicit allowlist prevents future internal/customer fields leaking into staff responses.
  if (role === 'staff') {
    const record = value as Record<string, unknown>;
    const items = record.items as { productId: unknown; sku: string; name: string; qty: number }[];
    return {
      _id: record._id,
      code: record.code,
      customerName: record.customerName,
      channel: record.channel,
      status: record.status,
      createdAt: record.createdAt,
      statusHistory: record.statusHistory,
      items: items.map((item) => ({
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        qty: item.qty,
      })),
    };
  }
  const result = { ...value } as Record<string, unknown>;
  delete result.requestHash;
  delete result.idempotencyKey;
  return result;
}
export async function getOrder(actor: Actor, id: string) {
  const order = await Order.findOne({ _id: id, shopId: actor.shopId }).lean();
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');
  return publicOrder(order, actor.role);
}
export async function listOrders(actor: Actor, query: OrderQuery) {
  const today = istDay();
  const filter = {
    shopId: actor.shopId,
    ...(query.status
      ? { status: query.status }
      : actor.role === 'staff'
        ? { status: { $in: ['pending', 'packed'] as OrderStatus[] } }
        : {}),
    ...(query.from || query.to || actor.role === 'staff'
      ? {
          createdAt: {
            $gte: dayStart(query.from ?? (actor.role === 'staff' ? today : '2000-01-01')),
            $lt: nextDay(query.to ?? today),
          },
        }
      : {}),
    ...(query.q
      ? {
          $or: [
            { code: { $regex: literalSearch(query.q), $options: 'i' } },
            { customerName: { $regex: literalSearch(query.q), $options: 'i' } },
          ],
        }
      : {}),
  };
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Order.countDocuments(filter),
  ]);
  return {
    items: orders.map((order) => publicOrder(order, actor.role)),
    total,
    page: query.page,
    limit: query.limit,
  };
}
