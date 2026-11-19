import mongoose, { type ClientSession, type Types } from 'mongoose';
import { createHash } from 'node:crypto';
import { Product, InventoryMovement } from '../models';
import { AppError, isDuplicate } from '../lib/appError';
import type { Actor } from '../middleware/auth';
export type StockLine = { productId: Types.ObjectId; qty: number };
// The caller owns the transaction; reservations, ledger entries and order commit together.
export async function reserveStock(
  actor: Actor,
  items: StockLine[],
  orderId: Types.ObjectId,
  session: ClientSession,
) {
  for (const item of items) {
    const product = await Product.findOneAndUpdate(
      { _id: item.productId, shopId: actor.shopId, isActive: true, stock: { $gte: item.qty } },
      { $inc: { stock: -item.qty, stockVersion: 1 } },
      { returnDocument: 'after', session },
    );
    if (!product)
      throw new AppError(
        409,
        'INSUFFICIENT_STOCK',
        'An item no longer has enough stock. Refresh the catalog and try again.',
      );
    await InventoryMovement.create(
      [
        {
          shopId: actor.shopId,
          productId: item.productId,
          orderId,
          userId: actor.id,
          type: 'reserve',
          qty: item.qty,
          balanceAfter: product.stock,
        },
      ],
      { session },
    );
  }
}
export async function restock(
  actor: Actor,
  items: StockLine[],
  orderId: Types.ObjectId,
  session: ClientSession,
) {
  for (const item of items) {
    const product = await Product.findOneAndUpdate(
      { _id: item.productId, shopId: actor.shopId },
      { $inc: { stock: item.qty, stockVersion: 1 } },
      { returnDocument: 'after', session },
    );
    if (!product)
      throw new AppError(409, 'MISSING_PRODUCT', 'A product is unavailable for restocking');
    await InventoryMovement.create(
      [
        {
          shopId: actor.shopId,
          productId: item.productId,
          orderId,
          userId: actor.id,
          type: 'restock',
          qty: item.qty,
          balanceAfter: product.stock,
        },
      ],
      { session },
    );
  }
}
export async function receiveStock(
  actor: Actor,
  productId: string,
  input: { qty: number; note?: string },
  key?: string,
) {
  const hash = createHash('sha256')
    .update(JSON.stringify({ productId, ...input }))
    .digest('hex');
  const existing = async () => {
    const movement = key
      ? await InventoryMovement.findOne({ shopId: actor.shopId, idempotencyKey: key })
      : null;
    if (movement && movement.requestHash !== hash)
      throw new AppError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'This retry key was already used for another delivery',
      );
    return movement;
  };
  const cached = await existing();
  if (cached) return cached;
  try {
    return await mongoose.connection.transaction(async (session) => {
      const product = await Product.findOneAndUpdate(
        {
          _id: productId,
          shopId: actor.shopId,
          isActive: true,
          stock: { $lte: 100000000 - input.qty },
        },
        { $inc: { stock: input.qty, stockVersion: 1 } },
        { session, returnDocument: 'after' },
      );
      if (!product)
        throw new AppError(
          409,
          'PRODUCT_UNAVAILABLE',
          'Product is unavailable or stock would exceed the limit',
        );
      const [movement] = await InventoryMovement.create(
        [
          {
            shopId: actor.shopId,
            productId,
            userId: actor.id,
            type: 'receive',
            qty: input.qty,
            balanceAfter: product.stock,
            note: input.note,
            ...(key ? { idempotencyKey: key, requestHash: hash } : {}),
          },
        ],
        { session },
      );
      if (!movement) throw new AppError(500, 'INTERNAL', 'Stock could not be recorded');
      return movement;
    });
  } catch (error) {
    if (key && isDuplicate(error)) {
      const saved = await existing();
      if (saved) return saved;
    }
    throw error;
  }
}
export async function listMovements(
  actor: Actor,
  productId: string,
  query: { page: number; limit: number },
) {
  if (!(await Product.exists({ _id: productId, shopId: actor.shopId })))
    throw new AppError(404, 'NOT_FOUND', 'Product not found');
  const filter = { shopId: actor.shopId, productId };
  const [items, total] = await Promise.all([
    InventoryMovement.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    InventoryMovement.countDocuments(filter),
  ]);
  return { items, total, page: query.page, limit: query.limit };
}
