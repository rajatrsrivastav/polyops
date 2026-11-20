import { query, type Sql, type SqlValue } from '../db/pool';
import { likeContains } from '../db/rows';
import { Product, type ProductDoc } from '../db/store';
import { AppError, isDuplicate } from '../lib/appError';
import type { Actor } from '../middleware/auth';
export type ProductInput = {
  name: string;
  sku: string;
  pricePaise: number;
  lowStockThreshold: number;
};
export type ProductQuery = { page: number; limit: number; q?: string; lowStock?: boolean };
const db: Sql = { query };
function publicProduct(product: ProductDoc, role: Actor['role']) {
  const base = {
    _id: product._id,
    shopId: product.shopId,
    sku: product.sku,
    name: product.name,
    stock: product.stock,
    stockVersion: product.stockVersion,
    lowStockThreshold: product.lowStockThreshold,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
  if (role === 'staff') return base;
  return { ...base, pricePaise: product.pricePaise };
}
export async function listProducts(actor: Actor, input: ProductQuery) {
  const params: SqlValue[] = [actor.shopId];
  const where = ['shop_id = $1', 'is_active = true'];
  if (input.q) {
    params.push(likeContains(input.q));
    where.push(`(name ILIKE $${params.length} ESCAPE '\\' OR sku ILIKE $${params.length} ESCAPE '\\')`);
  }
  if (input.lowStock) where.push('stock <= low_stock_threshold');
  const clause = where.join(' AND ');
  const totalRow = await db.query(`SELECT COUNT(*)::bigint AS total FROM products WHERE ${clause}`, params);
  const total = Number(totalRow.rows[0]?.total ?? 0);
  const listed = await db.query(
    `SELECT id FROM products WHERE ${clause} ORDER BY created_at DESC, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, input.limit, (input.page - 1) * input.limit],
  );
  const items = [];
  for (const row of listed.rows) {
    const product = await Product.findById(String(row.id));
    if (product) items.push(publicProduct(product, actor.role));
  }
  return { items, total, page: input.page, limit: input.limit };
}
export async function createProduct(actor: Actor, input: ProductInput) {
  try {
    return publicProduct(
      await Product.create({ ...input, shopId: actor.shopId }),
      actor.role,
    );
  } catch (error) {
    if (isDuplicate(error))
      throw new AppError(409, 'DUPLICATE_SKU', 'This SKU already exists in your shop');
    throw error;
  }
}
export async function updateProduct(
  actor: Actor,
  id: string,
  input: Partial<ProductInput> & { isActive?: boolean },
) {
  try {
    const product = await Product.updateFields(id, actor.shopId, input);
    if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
    return publicProduct(product, actor.role);
  } catch (error) {
    if (isDuplicate(error))
      throw new AppError(409, 'DUPLICATE_SKU', 'This SKU already exists in your shop');
    throw error;
  }
}
