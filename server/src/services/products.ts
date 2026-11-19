import { Product } from '../models';
import { AppError, isDuplicate } from '../lib/appError';
import type { Actor } from '../middleware/auth';
export type ProductInput = {
  name: string;
  sku: string;
  pricePaise: number;
  lowStockThreshold: number;
};
export type ProductQuery = { page: number; limit: number; q?: string; lowStock?: boolean };
export function literalSearch(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export async function listProducts(actor: Actor, query: ProductQuery) {
  const filter = {
    shopId: actor.shopId,
    isActive: true,
    ...(query.q
      ? {
          $or: [
            { name: { $regex: literalSearch(query.q), $options: 'i' } },
            { sku: { $regex: literalSearch(query.q), $options: 'i' } },
          ],
        }
      : {}),
    ...(query.lowStock ? { $expr: { $lte: ['$stock', '$lowStockThreshold'] } } : {}),
  };
  const [items, total] = await Promise.all([
    Product.find(filter)
      .select(actor.role === 'staff' ? '-pricePaise' : '')
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { items, total, page: query.page, limit: query.limit };
}
export async function createProduct(actor: Actor, input: ProductInput) {
  try {
    return await Product.create({ ...input, shopId: actor.shopId });
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
    const product = await Product.findOneAndUpdate(
      { _id: id, shopId: actor.shopId },
      { $set: input },
      { returnDocument: 'after', runValidators: true },
    );
    if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
    return product;
  } catch (error) {
    if (isDuplicate(error))
      throw new AppError(409, 'DUPLICATE_SKU', 'This SKU already exists in your shop');
    throw error;
  }
}
