import { query, transaction, type Sql, type SqlRow, type SqlValue } from './pool';
import {
  asBool,
  asJson,
  asOptionalString,
  asRowDate,
  asRowInt,
  asString,
  newId,
} from './rows';
const pool: Sql = { query };
export type Role = 'owner' | 'staff';
export type OrderStatus = 'pending' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
export type Channel = 'instagram' | 'whatsapp' | 'website' | 'other';
export type MovementType = 'reserve' | 'restock' | 'receive';
export type OrderItem = {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unitPricePaise: number;
};
export type StatusEvent = { status: OrderStatus; at: Date; userId: string };
export type ShopDoc = {
  _id: string;
  id: string;
  name: string;
  slug: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type UserDoc = {
  _id: string;
  id: string;
  authUserId: string;
  shopId: string;
  role: Role;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};
export type ProductDoc = {
  _id: string;
  id: string;
  shopId: string;
  sku: string;
  name: string;
  pricePaise: number;
  stock: number;
  stockVersion: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type OrderDoc = {
  _id: string;
  id: string;
  shopId: string;
  code: string;
  items: OrderItem[];
  channel: Channel;
  customerName: string;
  customerPhone: string;
  subtotalPaise: number;
  status: OrderStatus;
  idempotencyKey?: string;
  requestHash?: string;
  statusHistory: StatusEvent[];
  createdAt: Date;
  updatedAt: Date;
};
export type MovementDoc = {
  _id: string;
  id: string;
  shopId: string;
  productId: string;
  orderId?: string;
  userId: string;
  type: MovementType;
  qty: number;
  balanceAfter: number;
  note?: string;
  idempotencyKey?: string;
  requestHash?: string;
  createdAt: Date;
  updatedAt: Date;
};
export type BriefDoc = {
  _id: string;
  id: string;
  shopId: string;
  week: string;
  state: 'building' | 'ready';
  leaseId?: string;
  leaseExpiresAt?: Date;
  headline: string;
  bullets: string[];
  risks: string[];
  source: Record<string, unknown>;
  provider: 'gemini' | 'template';
  createdAt: Date;
  updatedAt: Date;
};
function roleOf(value: string): Role {
  if (value === 'owner' || value === 'staff') return value;
  throw new Error('Expected a shop role');
}
function channelOf(value: string): Channel {
  if (value === 'instagram' || value === 'whatsapp' || value === 'website' || value === 'other')
    return value;
  throw new Error('Expected an order channel');
}
function statusOf(value: string): OrderStatus {
  if (
    value === 'pending' ||
    value === 'packed' ||
    value === 'shipped' ||
    value === 'delivered' ||
    value === 'cancelled'
  )
    return value;
  throw new Error('Expected an order status');
}
function movementTypeOf(value: string): MovementType {
  if (value === 'reserve' || value === 'restock' || value === 'receive') return value;
  throw new Error('Expected a movement type');
}
function providerOf(value: string): 'gemini' | 'template' {
  if (value === 'gemini' || value === 'template') return value;
  throw new Error('Expected a brief provider');
}
function shop(row: SqlRow): ShopDoc {
  const id = asString(row, 'id');
  return {
    _id: id,
    id,
    name: asString(row, 'name'),
    slug: asString(row, 'slug'),
    isDemo: asBool(row, 'is_demo'),
    createdAt: asRowDate(row, 'created_at'),
    updatedAt: asRowDate(row, 'updated_at'),
  };
}
function user(row: SqlRow): UserDoc {
  const id = asString(row, 'id');
  return {
    _id: id,
    id,
    authUserId: asString(row, 'auth_user_id'),
    shopId: asString(row, 'shop_id'),
    role: roleOf(asString(row, 'role')),
    email: asString(row, 'email'),
    createdAt: asRowDate(row, 'created_at'),
    updatedAt: asRowDate(row, 'updated_at'),
  };
}
function product(row: SqlRow): ProductDoc {
  const id = asString(row, 'id');
  return {
    _id: id,
    id,
    shopId: asString(row, 'shop_id'),
    sku: asString(row, 'sku'),
    name: asString(row, 'name'),
    pricePaise: asRowInt(row, 'price_paise'),
    stock: asRowInt(row, 'stock'),
    stockVersion: asRowInt(row, 'stock_version'),
    lowStockThreshold: asRowInt(row, 'low_stock_threshold'),
    isActive: asBool(row, 'is_active'),
    createdAt: asRowDate(row, 'created_at'),
    updatedAt: asRowDate(row, 'updated_at'),
  };
}
function orderItems(value: unknown) {
  const items = asJson<OrderItem[]>(value, 'items');
  if (!Array.isArray(items)) throw new Error('Expected order items');
  return items;
}
function statusHistory(value: unknown) {
  const events = asJson<Array<{ status: OrderStatus; at: string; userId: string }>>(value, 'status_history');
  if (!Array.isArray(events)) throw new Error('Expected status history');
  return events.map((event) => ({
    status: event.status,
    userId: event.userId,
    at: new Date(event.at),
  }));
}
function order(row: SqlRow): OrderDoc {
  const id = asString(row, 'id');
  return {
    _id: id,
    id,
    shopId: asString(row, 'shop_id'),
    code: asString(row, 'code'),
    items: orderItems(row.items),
    channel: channelOf(asString(row, 'channel')),
    customerName: asString(row, 'customer_name'),
    customerPhone: asString(row, 'customer_phone'),
    subtotalPaise: asRowInt(row, 'subtotal_paise'),
    status: statusOf(asString(row, 'status')),
    idempotencyKey: asOptionalString(row, 'idempotency_key'),
    requestHash: asOptionalString(row, 'request_hash'),
    statusHistory: statusHistory(row.status_history),
    createdAt: asRowDate(row, 'created_at'),
    updatedAt: asRowDate(row, 'updated_at'),
  };
}
function movement(row: SqlRow): MovementDoc {
  const id = asString(row, 'id');
  return {
    _id: id,
    id,
    shopId: asString(row, 'shop_id'),
    productId: asString(row, 'product_id'),
    orderId: asOptionalString(row, 'order_id'),
    userId: asString(row, 'user_id'),
    type: movementTypeOf(asString(row, 'type')),
    qty: asRowInt(row, 'qty'),
    balanceAfter: asRowInt(row, 'balance_after'),
    note: asOptionalString(row, 'note'),
    idempotencyKey: asOptionalString(row, 'idempotency_key'),
    requestHash: asOptionalString(row, 'request_hash'),
    createdAt: asRowDate(row, 'created_at'),
    updatedAt: asRowDate(row, 'updated_at'),
  };
}
function briefState(value: string): 'building' | 'ready' {
  if (value === 'building' || value === 'ready') return value;
  throw new Error('Expected a brief state');
}
function brief(row: SqlRow): BriefDoc {
  const id = asString(row, 'id');
  const leaseExpires = row.lease_expires_at;
  return {
    _id: id,
    id,
    shopId: asString(row, 'shop_id'),
    week: asString(row, 'week'),
    state: briefState(asString(row, 'state')),
    leaseId: asOptionalString(row, 'lease_id'),
    leaseExpiresAt:
      leaseExpires === null || leaseExpires === undefined ? undefined : asRowDate(row, 'lease_expires_at'),
    headline: asString(row, 'headline'),
    bullets: asJson<string[]>(row.bullets, 'bullets'),
    risks: asJson<string[]>(row.risks, 'risks'),
    source: asJson<Record<string, unknown>>(row.source, 'source'),
    provider: providerOf(asString(row, 'provider')),
    createdAt: asRowDate(row, 'created_at'),
    updatedAt: asRowDate(row, 'updated_at'),
  };
}
async function one(db: Sql, text: string, params: readonly SqlValue[] = []) {
  const result = await db.query(text, params);
  return result.rows[0] ?? null;
}
async function many(db: Sql, text: string, params: readonly SqlValue[] = []) {
  return (await db.query(text, params)).rows;
}
async function countOf(db: Sql, text: string, params: readonly SqlValue[] = []) {
  const row = await one(db, text, params);
  return row ? asRowInt(row, 'total') : 0;
}
const shopColumns = `id, name, slug, is_demo, created_at, updated_at`;
const userColumns = `id, auth_user_id, shop_id, role, email, created_at, updated_at`;
const productColumns = `id, shop_id, sku, name, price_paise, stock, stock_version, low_stock_threshold, is_active, created_at, updated_at`;
const orderColumns = `id, shop_id, code, items, channel, customer_name, customer_phone, subtotal_paise, status, idempotency_key, request_hash, status_history, created_at, updated_at`;
const movementColumns = `id, shop_id, product_id, order_id, user_id, type, qty, balance_after, note, idempotency_key, request_hash, created_at, updated_at`;
const briefColumns = `id, shop_id, week, state, lease_id, lease_expires_at, headline, bullets, risks, source, provider, created_at, updated_at`;
export const Shop = {
  async create(
    input: { name: string; slug: string; isDemo?: boolean },
    db: Sql = pool,
  ): Promise<ShopDoc> {
    const row = await one(
      db,
      `INSERT INTO shops (id, name, slug, is_demo) VALUES ($1, $2, $3, $4) RETURNING ${shopColumns}`,
      [newId(), input.name, input.slug, input.isDemo === true],
    );
    if (!row) throw new Error('Shop insert returned no row');
    return shop(row);
  },
  async findById(id: string, db: Sql = pool) {
    const row = await one(db, `SELECT ${shopColumns} FROM shops WHERE id = $1`, [id]);
    return row ? shop(row) : null;
  },
  async findBySlug(slug: string, db: Sql = pool) {
    const row = await one(db, `SELECT ${shopColumns} FROM shops WHERE slug = $1`, [slug]);
    return row ? shop(row) : null;
  },
  async deleteById(id: string, db: Sql = pool) {
    await db.query(`DELETE FROM shops WHERE id = $1`, [id]);
  },
};
export const User = {
  async create(
    input: { authUserId: string; shopId: string; role: Role; email: string },
    db: Sql = pool,
  ) {
    const row = await one(
      db,
      `INSERT INTO users (id, auth_user_id, shop_id, role, email) VALUES ($1, $2, $3, $4, $5) RETURNING ${userColumns}`,
      [newId(), input.authUserId, input.shopId, input.role, input.email],
    );
    if (!row) throw new Error('User insert returned no row');
    return user(row);
  },
  async createMany(
    inputs: { authUserId: string; shopId: string; role: Role; email: string }[],
    db: Sql = pool,
  ) {
    const created = [];
    for (const input of inputs) created.push(await User.create(input, db));
    return created;
  },
  async findByAuthUserId(authUserId: string, db: Sql = pool) {
    const row = await one(db, `SELECT ${userColumns} FROM users WHERE auth_user_id = $1`, [authUserId]);
    return row ? user(row) : null;
  },
  async findByShop(shopId: string, db: Sql = pool) {
    const result = await many(db, `SELECT ${userColumns} FROM users WHERE shop_id = $1 ORDER BY id`, [shopId]);
    return result.map(user);
  },
  async deleteByShop(shopId: string, db: Sql = pool) {
    await db.query(`DELETE FROM users WHERE shop_id = $1`, [shopId]);
  },
  async countOutsideShop(authUserIds: string[], shopId: string, db: Sql = pool) {
    if (authUserIds.length === 0) return 0;
    const placeholders = authUserIds.map((_, index) => `$${index + 2}`).join(', ');
    return countOf(
      db,
      `SELECT COUNT(*)::bigint AS total FROM users WHERE shop_id <> $1 AND auth_user_id IN (${placeholders})`,
      [shopId, ...authUserIds],
    );
  },
};
export type ProductWrite = {
  shopId: string;
  sku: string;
  name: string;
  pricePaise: number;
  stock?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
};
export const Product = {
  async create(input: ProductWrite, db: Sql = pool) {
    const row = await one(
      db,
      `INSERT INTO products (id, shop_id, sku, name, price_paise, stock, low_stock_threshold, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ${productColumns}`,
      [
        newId(),
        input.shopId,
        input.sku,
        input.name,
        input.pricePaise,
        input.stock ?? 0,
        input.lowStockThreshold ?? 5,
        input.isActive !== false,
      ],
    );
    if (!row) throw new Error('Product insert returned no row');
    return product(row);
  },
  async findById(id: string, db: Sql = pool) {
    const row = await one(db, `SELECT ${productColumns} FROM products WHERE id = $1`, [id]);
    return row ? product(row) : null;
  },
  async findByIds(shopId: string, ids: string[], activeOnly: boolean, db: Sql) {
    if (ids.length === 0) return [];
    const placeholders = ids.map((_, index) => `$${index + 2}`).join(', ');
    const active = activeOnly ? ' AND is_active = true' : '';
    const result = await many(
      db,
      `SELECT ${productColumns} FROM products WHERE shop_id = $1 AND id IN (${placeholders})${active}`,
      [shopId, ...ids],
    );
    return result.map(product);
  },
  async findByShop(shopId: string, db: Sql = pool) {
    const result = await many(
      db,
      `SELECT ${productColumns} FROM products WHERE shop_id = $1 ORDER BY created_at DESC, id DESC`,
      [shopId],
    );
    return result.map(product);
  },
  async updateFields(
    id: string,
    shopId: string,
    fields: Partial<Pick<ProductDoc, 'name' | 'sku' | 'pricePaise' | 'lowStockThreshold' | 'isActive'>>,
    db: Sql = pool,
  ) {
    const sets: string[] = [];
    const params: SqlValue[] = [];
    const mapping: [keyof typeof fields, string][] = [
      ['name', 'name'],
      ['sku', 'sku'],
      ['pricePaise', 'price_paise'],
      ['lowStockThreshold', 'low_stock_threshold'],
      ['isActive', 'is_active'],
    ];
    for (const [key, column] of mapping) {
      const value = fields[key];
      if (value !== undefined) {
        params.push(value);
        sets.push(`${column} = $${params.length}`);
      }
    }
    params.push(id, shopId);
    const row = await one(
      db,
      `UPDATE products SET ${sets.join(', ')}, updated_at = now()
       WHERE id = $${params.length - 1} AND shop_id = $${params.length}
       RETURNING ${productColumns}`,
      params,
    );
    return row ? product(row) : null;
  },
  async setThreshold(id: string, lowStockThreshold: number, db: Sql = pool) {
    const row = await one(
      db,
      `UPDATE products SET low_stock_threshold = $2, updated_at = now() WHERE id = $1 RETURNING ${productColumns}`,
      [id, lowStockThreshold],
    );
    return row ? product(row) : null;
  },
  async countByShop(shopId: string, db: Sql = pool) {
    return countOf(db, `SELECT COUNT(*)::bigint AS total FROM products WHERE shop_id = $1`, [shopId]);
  },
  async deleteByShop(shopId: string, db: Sql = pool) {
    await db.query(`DELETE FROM products WHERE shop_id = $1`, [shopId]);
  },
};
export type OrderWrite = {
  shopId: string;
  code: string;
  items: OrderItem[];
  channel: Channel;
  customerName: string;
  customerPhone: string;
  subtotalPaise: number;
  status?: OrderStatus;
  idempotencyKey?: string;
  requestHash?: string;
  statusHistory?: StatusEvent[];
  createdAt?: Date;
  updatedAt?: Date;
  _id?: string;
};
export const Order = {
  async create(input: OrderWrite, db: Sql = pool) {
    const id = input._id ?? newId();
    const history = (input.statusHistory ?? []).map((event) => ({
      status: event.status,
      userId: event.userId,
      at: event.at.toISOString(),
    }));
    const createdAt = input.createdAt ?? new Date();
    const row = await one(
      db,
      `INSERT INTO orders (
         id, shop_id, code, items, channel, customer_name, customer_phone, subtotal_paise, status,
         idempotency_key, request_hash, status_history, created_at, updated_at
       ) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14)
       RETURNING ${orderColumns}`,
      [
        id,
        input.shopId,
        input.code,
        JSON.stringify(input.items),
        input.channel,
        input.customerName,
        input.customerPhone,
        input.subtotalPaise,
        input.status ?? 'pending',
        input.idempotencyKey ?? null,
        input.requestHash ?? null,
        JSON.stringify(history),
        createdAt,
        input.updatedAt ?? createdAt,
      ],
    );
    if (!row) throw new Error('Order insert returned no row');
    return order(row);
  },
  async createMany(inputs: OrderWrite[], db: Sql = pool) {
    const created = [];
    for (const input of inputs) created.push(await Order.create(input, db));
    return created;
  },
  async findById(id: string, db: Sql = pool) {
    const row = await one(db, `SELECT ${orderColumns} FROM orders WHERE id = $1`, [id]);
    return row ? order(row) : null;
  },
  async findInShop(id: string, shopId: string, db: Sql = pool) {
    const row = await one(db, `SELECT ${orderColumns} FROM orders WHERE id = $1 AND shop_id = $2`, [id, shopId]);
    return row ? order(row) : null;
  },
  async findByIdempotency(shopId: string, key: string, db: Sql = pool) {
    const row = await one(
      db,
      `SELECT ${orderColumns} FROM orders WHERE shop_id = $1 AND idempotency_key = $2`,
      [shopId, key],
    );
    return row ? order(row) : null;
  },
  async count(shopId?: string, db: Sql = pool) {
    if (shopId)
      return countOf(db, `SELECT COUNT(*)::bigint AS total FROM orders WHERE shop_id = $1`, [shopId]);
    return countOf(db, `SELECT COUNT(*)::bigint AS total FROM orders`);
  },
  async countOpen(shopId: string, db: Sql = pool) {
    return countOf(
      db,
      `SELECT COUNT(*)::bigint AS total FROM orders WHERE shop_id = $1 AND status IN ('pending', 'packed')`,
      [shopId],
    );
  },
  async sumSubtotal(shopId: string, db: Sql = pool) {
    const row = await one(
      db,
      `SELECT COALESCE(SUM(subtotal_paise), 0)::bigint AS total FROM orders WHERE shop_id = $1`,
      [shopId],
    );
    return [{ _id: null, total: row ? asRowInt(row, 'total') : 0 }];
  },
  async replaceSchedule(
    id: string,
    shopId: string,
    input: { createdAt: Date; updatedAt: Date; statusHistory: StatusEvent[] },
    db: Sql = pool,
  ) {
    const history = input.statusHistory.map((event) => ({
      status: event.status,
      userId: event.userId,
      at: event.at.toISOString(),
    }));
    await db.query(
      `UPDATE orders SET created_at = $3, updated_at = $4, status_history = $5::jsonb
       WHERE id = $1 AND shop_id = $2`,
      [id, shopId, input.createdAt, input.updatedAt, JSON.stringify(history)],
    );
  },
  async deleteByShop(shopId: string, db: Sql = pool) {
    await db.query(`DELETE FROM orders WHERE shop_id = $1`, [shopId]);
  },
  async explainShopDate(shopId: string, from: Date) {
    return transaction(async (tx) => {
      await tx.query(`SET LOCAL enable_seqscan = off`);
      const result = await tx.query(
        `EXPLAIN SELECT id FROM orders WHERE shop_id = $1 AND created_at >= $2 ORDER BY created_at DESC, id DESC`,
        [shopId, from],
      );
      return result.rows.map((row) => String(row['QUERY PLAN'] ?? '')).join('\n');
    });
  },
};
export type MovementWrite = {
  shopId: string;
  productId: string;
  orderId?: string;
  userId: string;
  type: MovementType;
  qty: number;
  balanceAfter: number;
  note?: string;
  idempotencyKey?: string;
  requestHash?: string;
};
export const InventoryMovement = {
  async create(input: MovementWrite, db: Sql = pool) {
    const row = await one(
      db,
      `INSERT INTO inventory_movements (
         id, shop_id, product_id, order_id, user_id, type, qty, balance_after, note, idempotency_key, request_hash
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING ${movementColumns}`,
      [
        newId(),
        input.shopId,
        input.productId,
        input.orderId ?? null,
        input.userId,
        input.type,
        input.qty,
        input.balanceAfter,
        input.note ?? null,
        input.idempotencyKey ?? null,
        input.requestHash ?? null,
      ],
    );
    if (!row) throw new Error('Movement insert returned no row');
    return movement(row);
  },
  async findByIdempotency(shopId: string, key: string, db: Sql = pool) {
    const row = await one(
      db,
      `SELECT ${movementColumns} FROM inventory_movements WHERE shop_id = $1 AND idempotency_key = $2`,
      [shopId, key],
    );
    return row ? movement(row) : null;
  },
  async findByProduct(productId: string, db: Sql = pool) {
    const result = await many(
      db,
      `SELECT ${movementColumns} FROM inventory_movements WHERE product_id = $1 ORDER BY created_at DESC, id DESC`,
      [productId],
    );
    return result.map(movement);
  },
  async count(filter: { productId?: string; type?: MovementType } = {}, db: Sql = pool) {
    const params: SqlValue[] = [];
    const where: string[] = [];
    if (filter.productId) {
      params.push(filter.productId);
      where.push(`product_id = $${params.length}`);
    }
    if (filter.type) {
      params.push(filter.type);
      where.push(`type = $${params.length}`);
    }
    const clause = where.length ? ` WHERE ${where.join(' AND ')}` : '';
    return countOf(db, `SELECT COUNT(*)::bigint AS total FROM inventory_movements${clause}`, params);
  },
  async page(shopId: string, productId: string, page: number, limit: number, db: Sql = pool) {
    const filter = [shopId, productId];
    const total = await countOf(
      db,
      `SELECT COUNT(*)::bigint AS total FROM inventory_movements WHERE shop_id = $1 AND product_id = $2`,
      filter,
    );
    const result = await many(
      db,
      `SELECT ${movementColumns} FROM inventory_movements
       WHERE shop_id = $1 AND product_id = $2
       ORDER BY created_at DESC, id DESC
       LIMIT $3 OFFSET $4`,
      [...filter, limit, (page - 1) * limit],
    );
    return { items: result.map(movement), total };
  },
  async stampShop(shopId: string, type: MovementType, at: Date, db: Sql = pool) {
    await db.query(
      `UPDATE inventory_movements SET created_at = $3, updated_at = $3 WHERE shop_id = $1 AND type = $2`,
      [shopId, type, at],
    );
  },
  async stampOrder(shopId: string, orderId: string, at: Date, db: Sql = pool) {
    await db.query(
      `UPDATE inventory_movements SET created_at = $3, updated_at = $3 WHERE shop_id = $1 AND order_id = $2`,
      [shopId, orderId, at],
    );
  },
  async deleteByShop(shopId: string, db: Sql = pool) {
    await db.query(`DELETE FROM inventory_movements WHERE shop_id = $1`, [shopId]);
  },
};
export const Counter = {
  async ensure(shopId: string, db: Sql = pool) {
    await db.query(
      `INSERT INTO counters (shop_id, seq) VALUES ($1, 0) ON CONFLICT (shop_id) DO NOTHING`,
      [shopId],
    );
  },
  async next(shopId: string, db: Sql) {
    const row = await one(
      db,
      `UPDATE counters SET seq = seq + 1, updated_at = now() WHERE shop_id = $1 RETURNING seq`,
      [shopId],
    );
    return row ? asRowInt(row, 'seq') : null;
  },
  async deleteByShop(shopId: string, db: Sql = pool) {
    await db.query(`DELETE FROM counters WHERE shop_id = $1`, [shopId]);
  },
};
export const AiBrief = {
  async findByWeek(shopId: string, week: string, db: Sql = pool) {
    const row = await one(
      db,
      `SELECT ${briefColumns} FROM ai_briefs WHERE shop_id = $1 AND week = $2`,
      [shopId, week],
    );
    return row ? brief(row) : null;
  },
  async findFirst(db: Sql = pool) {
    const row = await one(db, `SELECT ${briefColumns} FROM ai_briefs ORDER BY created_at LIMIT 1`);
    return row ? brief(row) : null;
  },
  async count(db: Sql = pool) {
    return countOf(db, `SELECT COUNT(*)::bigint AS total FROM ai_briefs`);
  },
  async insert(
    input: {
      shopId: string;
      week: string;
      state: 'building' | 'ready';
      leaseId: string;
      leaseExpiresAt: Date;
      headline: string;
      bullets: string[];
      risks: string[];
      source: unknown;
      provider: 'gemini' | 'template';
    },
    db: Sql = pool,
  ) {
    const row = await one(
      db,
      `INSERT INTO ai_briefs (
         id, shop_id, week, state, lease_id, lease_expires_at, headline, bullets, risks, source, provider
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11)
       RETURNING ${briefColumns}`,
      [
        newId(),
        input.shopId,
        input.week,
        input.state,
        input.leaseId,
        input.leaseExpiresAt,
        input.headline,
        JSON.stringify(input.bullets),
        JSON.stringify(input.risks),
        JSON.stringify(input.source),
        input.provider,
      ],
    );
    if (!row) throw new Error('Brief insert returned no row');
    return brief(row);
  },
  async claim(
    shopId: string,
    week: string,
    leaseId: string,
    leaseExpiresAt: Date,
    source: unknown,
    db: Sql = pool,
  ) {
    const row = await one(
      db,
      `UPDATE ai_briefs
       SET lease_id = $3, lease_expires_at = $4, source = $5::jsonb, updated_at = now()
       WHERE shop_id = $1 AND week = $2 AND state = 'building' AND lease_expires_at < now()
       RETURNING ${briefColumns}`,
      [shopId, week, leaseId, leaseExpiresAt, JSON.stringify(source)],
    );
    return row ? brief(row) : null;
  },
  async finish(
    shopId: string,
    week: string,
    leaseId: string,
    input: { headline: string; bullets: string[]; risks: string[]; source: unknown; provider: 'gemini' | 'template' },
    db: Sql = pool,
  ) {
    const row = await one(
      db,
      `UPDATE ai_briefs
       SET headline = $4, bullets = $5::jsonb, risks = $6::jsonb, source = $7::jsonb, provider = $8,
           state = 'ready', lease_id = NULL, lease_expires_at = NULL, updated_at = now()
       WHERE shop_id = $1 AND week = $2 AND lease_id = $3 AND state = 'building'
       RETURNING ${briefColumns}`,
      [
        shopId,
        week,
        leaseId,
        input.headline,
        JSON.stringify(input.bullets),
        JSON.stringify(input.risks),
        JSON.stringify(input.source),
        input.provider,
      ],
    );
    return row ? brief(row) : null;
  },
  async deleteByShop(shopId: string, db: Sql = pool) {
    await db.query(`DELETE FROM ai_briefs WHERE shop_id = $1`, [shopId]);
  },
};
export async function adjustStock(
  db: Sql,
  input: {
    productId: string;
    shopId: string;
    delta: number;
    requireActive: boolean;
    stockAtLeast?: number;
    stockAtMost?: number;
  },
) {
  const params: SqlValue[] = [input.productId, input.shopId, input.delta];
  const where = ['id = $1', 'shop_id = $2'];
  if (input.requireActive) where.push('is_active = true');
  if (input.stockAtLeast !== undefined) {
    params.push(input.stockAtLeast);
    where.push(`stock >= $${params.length}`);
  }
  if (input.stockAtMost !== undefined) {
    params.push(input.stockAtMost);
    where.push(`stock <= $${params.length}`);
  }
  const row = await one(
    db,
    `UPDATE products
     SET stock = stock + $3, stock_version = stock_version + 1, updated_at = now()
     WHERE ${where.join(' AND ')}
     RETURNING ${productColumns}`,
    params,
  );
  return row ? product(row) : null;
}
