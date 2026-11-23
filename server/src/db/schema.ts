import { query, type Sql } from './pool';
const statements = [
  `CREATE TABLE IF NOT EXISTS shops (
    id text PRIMARY KEY,
    name text NOT NULL CHECK (char_length(name) <= 100),
    slug text NOT NULL UNIQUE,
    is_demo boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY,
    auth_user_id text NOT NULL UNIQUE,
    shop_id text NOT NULL,
    role text NOT NULL CHECK (role IN ('owner', 'staff')),
    email text NOT NULL CHECK (char_length(email) <= 254),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS users_shop_id_idx ON users (shop_id)`,
  `CREATE TABLE IF NOT EXISTS products (
    id text PRIMARY KEY,
    shop_id text NOT NULL,
    sku text NOT NULL CHECK (char_length(sku) <= 40),
    name text NOT NULL CHECK (char_length(name) <= 100),
    price_paise integer NOT NULL CHECK (price_paise >= 0 AND price_paise <= 100000000),
    stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0 AND stock <= 100000000),
    stock_version integer NOT NULL DEFAULT 0,
    low_stock_threshold integer NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0 AND low_stock_threshold <= 1000000),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (shop_id, sku)
  )`,
  `CREATE INDEX IF NOT EXISTS products_shop_active_created_idx ON products (shop_id, is_active, created_at DESC, id DESC)`,
  `CREATE TABLE IF NOT EXISTS orders (
    id text PRIMARY KEY,
    shop_id text NOT NULL,
    code text NOT NULL,
    items jsonb NOT NULL,
    channel text NOT NULL CHECK (channel IN ('instagram', 'whatsapp', 'website', 'other')),
    customer_name text NOT NULL CHECK (char_length(customer_name) <= 100),
    customer_phone text NOT NULL CHECK (char_length(customer_phone) <= 10),
    subtotal_paise integer NOT NULL CHECK (subtotal_paise >= 0),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'packed', 'shipped', 'delivered', 'cancelled')),
    idempotency_key text,
    request_hash text,
    status_history jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (shop_id, code)
  )`,
  // Optional idempotency keys need a partial unique index. A plain unique index would treat every missing key as equal.
  `CREATE UNIQUE INDEX IF NOT EXISTS orders_shop_idempotency_idx ON orders (shop_id, idempotency_key) WHERE idempotency_key IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS orders_shop_id_created_at_idx ON orders (shop_id, created_at DESC, id DESC)`,
  `CREATE INDEX IF NOT EXISTS orders_shop_status_created_idx ON orders (shop_id, status, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS inventory_movements (
    id text PRIMARY KEY,
    shop_id text NOT NULL,
    product_id text NOT NULL,
    order_id text,
    user_id text NOT NULL,
    type text NOT NULL CHECK (type IN ('reserve', 'restock', 'receive')),
    qty integer NOT NULL CHECK (qty >= 1),
    balance_after integer NOT NULL CHECK (balance_after >= 0),
    note text CHECK (note IS NULL OR char_length(note) <= 200),
    idempotency_key text,
    request_hash text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS movements_shop_product_created_idx ON inventory_movements (shop_id, product_id, created_at DESC, id DESC)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS movements_shop_idempotency_idx ON inventory_movements (shop_id, idempotency_key) WHERE idempotency_key IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS counters (
    shop_id text PRIMARY KEY,
    seq integer NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS ai_briefs (
    id text PRIMARY KEY,
    shop_id text NOT NULL,
    week text NOT NULL,
    state text NOT NULL DEFAULT 'ready' CHECK (state IN ('building', 'ready')),
    lease_id text,
    lease_expires_at timestamptz,
    headline text NOT NULL,
    bullets jsonb NOT NULL,
    risks jsonb NOT NULL,
    source jsonb NOT NULL,
    provider text NOT NULL CHECK (provider IN ('gemini', 'template')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (shop_id, week)
  )`,
  // Better Auth 1.7.26 postgres migration. Quoted camelCase columns match that adapter.
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "emailVerified" boolean NOT NULL,
    "image" text,
    "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY,
    "expiresAt" timestamptz NOT NULL,
    "token" text NOT NULL UNIQUE,
    "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamptz NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamptz,
    "refreshTokenExpiresAt" timestamptz,
    "scope" text,
    "password" text,
    "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamptz NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamptz NOT NULL,
    "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId")`,
  `CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId")`,
  `CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier")`,
];
export async function ensureSchema(executor: Sql = { query }) {
  for (const statement of statements) await executor.query(statement);
}
export async function resetDatabase() {
  await query(
    `TRUNCATE TABLE
      inventory_movements,
      orders,
      ai_briefs,
      counters,
      products,
      users,
      shops,
      "session",
      "account",
      "verification",
      "user"
    RESTART IDENTITY CASCADE`,
  );
}
