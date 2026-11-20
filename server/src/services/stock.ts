import { createHash } from 'node:crypto';
import { adjustStock, InventoryMovement, Product, type MovementDoc } from '../db/store';
import { query, transaction, type Sql } from '../db/pool';
import { AppError, isDuplicate } from '../lib/appError';
import type { Actor } from '../middleware/auth';
const db = { query };
export type StockLine = { productId: string; qty: number };
async function writeMovement(
  tx: Sql,
  actor: Actor,
  item: StockLine,
  orderId: string | undefined,
  type: 'reserve' | 'restock' | 'receive',
  balanceAfter: number,
  extra: { note?: string; idempotencyKey?: string; requestHash?: string } = {},
) {
  return InventoryMovement.create(
    {
      shopId: actor.shopId,
      productId: item.productId,
      orderId,
      userId: actor.id,
      type,
      qty: item.qty,
      balanceAfter,
      ...extra,
    },
    tx,
  );
}
export function movementResponse(movement: MovementDoc) {
  return {
    _id: movement._id,
    shopId: movement.shopId,
    productId: movement.productId,
    orderId: movement.orderId,
    userId: movement.userId,
    type: movement.type,
    qty: movement.qty,
    balanceAfter: movement.balanceAfter,
    note: movement.note,
    createdAt: movement.createdAt,
    updatedAt: movement.updatedAt,
  };
}
export async function reserveStock(actor: Actor, items: StockLine[], orderId: string, tx: Sql) {
  for (const item of items) {
    const product = await adjustStock(tx, {
      productId: item.productId,
      shopId: actor.shopId,
      delta: -item.qty,
      requireActive: true,
      stockAtLeast: item.qty,
    });
    if (!product)
      throw new AppError(
        409,
        'INSUFFICIENT_STOCK',
        'An item no longer has enough stock. Refresh the catalog and try again.',
      );
    await writeMovement(tx, actor, item, orderId, 'reserve', product.stock);
  }
}
export async function restock(actor: Actor, items: StockLine[], orderId: string, tx: Sql) {
  for (const item of items) {
    const product = await adjustStock(tx, {
      productId: item.productId,
      shopId: actor.shopId,
      delta: item.qty,
      requireActive: false,
    });
    if (!product)
      throw new AppError(409, 'MISSING_PRODUCT', 'A product is unavailable for restocking');
    await writeMovement(tx, actor, item, orderId, 'restock', product.stock);
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
    const movement = key ? await InventoryMovement.findByIdempotency(actor.shopId, key) : null;
    if (movement && movement.requestHash !== hash)
      throw new AppError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'This retry key was already used for another delivery',
      );
    return movement;
  };
  const cached = await existing();
  if (cached) return movementResponse(cached);
  try {
    return await transaction(async (tx) => {
      const again = key ? await InventoryMovement.findByIdempotency(actor.shopId, key, tx) : null;
      if (again) {
        if (again.requestHash !== hash)
          throw new AppError(
            409,
            'IDEMPOTENCY_CONFLICT',
            'This retry key was already used for another delivery',
          );
        return movementResponse(again);
      }
      const product = await adjustStock(tx, {
        productId,
        shopId: actor.shopId,
        delta: input.qty,
        requireActive: true,
        stockAtMost: 100000000 - input.qty,
      });
      if (!product)
        throw new AppError(
          409,
          'PRODUCT_UNAVAILABLE',
          'Product is unavailable or stock would exceed the limit',
        );
      return movementResponse(
        await writeMovement(tx, actor, { productId, qty: input.qty }, undefined, 'receive', product.stock, {
          note: input.note,
          ...(key ? { idempotencyKey: key, requestHash: hash } : {}),
        }),
      );
    });
  } catch (error) {
    if (key && isDuplicate(error)) {
      const saved = await existing();
      if (saved) return movementResponse(saved);
    }
    throw error;
  }
}
export async function listMovements(
  actor: Actor,
  productId: string,
  paging: { page: number; limit: number },
) {
  const product = await Product.findById(productId);
  if (!product || product.shopId !== actor.shopId)
    throw new AppError(404, 'NOT_FOUND', 'Product not found');
  const page = await InventoryMovement.page(actor.shopId, productId, paging.page, paging.limit, db);
  return {
    items: page.items.map(movementResponse),
    total: page.total,
    page: paging.page,
    limit: paging.limit,
  };
}
