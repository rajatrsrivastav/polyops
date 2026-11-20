import { markTestDatabaseClosed, reconnectTestDatabase } from './setup';
import request from 'supertest';
import { createApp } from '../src/app';
import { InventoryMovement, Order, Product, Shop, User } from '../src/models';
import { readConfig } from '../src/config';
import { verifyBearerToken } from '../src/lib/session';
jest.mock('../src/lib/session', () => ({ verifyBearerToken: jest.fn() }));
const verify = jest.mocked(verifyBearerToken);
const app = createApp({
  corsOrigins: ['http://localhost:5173'],
  logLevel: 'silent',
  trustProxyHops: 0,
  rateLimitMax: 10000,
});
let shopId: string;
let productId: string;
async function fixtures(stock = 3) {
  const shop = await Shop.create({ name: 'Millet & Co.', slug: 'millet-co', isDemo: true });
  shopId = shop.id;
  await User.createMany([
    { authUserId: 'owner-uid', shopId, role: 'owner', email: 'owner@example.test' },
    { authUserId: 'staff-uid', shopId, role: 'staff', email: 'staff@example.test' },
  ]);
  const product = await Product.create({
    shopId,
    sku: 'RAGI-01',
    name: 'Ragi Cookies',
    pricePaise: 18000,
    stock,
    lowStockThreshold: 2,
  });
  productId = product.id;
}
function auth(role = 'owner') {
  return { Authorization: `Bearer ${role}` };
}
function payload(qty = 1) {
  return {
    items: [{ productId, qty }],
    channel: 'instagram' as const,
    customerName: 'Demo Customer',
    customerPhone: '9999999999',
  };
}
beforeEach(() => {
  verify.mockReset();
  verify.mockImplementation(async (token: string) => {
    if (!['owner', 'staff', 'stranger'].includes(token)) return null;
    return { authUserId: `${token}-uid` };
  });
});
describe('API foundation', () => {
  test('AC1: health has no authentication or database dependency', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, ts: expect.any(String) });
    expect(verify).not.toHaveBeenCalled();
  });
  test('AC2: unknown routes use the documented 404 error shape', async () => {
    const response = await request(app).get('/missing');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
  test('AC3: rejects unknown CORS origins and allows the explicit origin', async () => {
    expect((await request(app).get('/health').set('Origin', 'https://evil.example')).status).toBe(
      403,
    );
    const response = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
  test('AC4: readiness pings the real Mongo replica set', async () => {
    expect((await request(app).get('/ready')).status).toBe(200);
  });
  test('AC28: liveness stays up while disconnected and readiness returns 503', async () => {
    markTestDatabaseClosed();
    try {
      expect((await request(app).get('/health')).status).toBe(200);
      const response = await request(app).get('/ready');
      expect(response.status).toBe(503);
      expect(response.body.error.code).toBe('NOT_READY');
    } finally {
      await reconnectTestDatabase();
    }
  });
  test('AC5: configuration rejects missing names without leaking supplied values', () => {
    expect(() => readConfig({})).toThrow(/DATABASE_URL/);
    try {
      readConfig({ DATABASE_URL: 'sensitive' });
    } catch (error) {
      expect(String(error)).not.toContain('sensitive');
    }
    expect(() =>
      readConfig({
        DATABASE_URL: 'postgres://local/packbay',
        BETTER_AUTH_SECRET: 'synthetic-test-secret-value-32chars',
        BETTER_AUTH_URL: 'http://localhost:3000',
        CORS_ORIGINS: '*',
      }),
    ).toThrow(/CORS_ORIGINS/);
  });
  test('AC6: malformed JSON and oversized bodies have safe errors', async () => {
    const malformed = await request(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .send('{');
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe('VALIDATION_ERROR');
    const oversized = await request(app)
      .post('/api/orders')
      .send({ text: 'x'.repeat(110000) });
    expect(oversized.status).toBe(413);
    expect(oversized.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
  test('AC7: global limiter returns the same error envelope', async () => {
    const limited = createApp({
      corsOrigins: [],
      logLevel: 'silent',
      trustProxyHops: 0,
      rateLimitMax: 1,
    });
    await request(limited).get('/missing');
    const response = await request(limited).get('/missing');
    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('RATE_LIMITED');
  });
});
describe('Authentication and shop isolation', () => {
  test('AC8: missing and invalid tokens return 401', async () => {
    expect((await request(app).get('/api/me')).status).toBe(401);
    expect((await request(app).get('/api/me').set(auth('garbage'))).status).toBe(401);
  });
  test('AC9: unprovisioned Firebase user returns 403', async () => {
    const response = await request(app).get('/api/me').set(auth('stranger'));
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('NOT_PROVISIONED');
  });
  test('AC10: role is loaded from Mongo; staff cannot create products', async () => {
    await fixtures();
    const me = await request(app).get('/api/me').set(auth());
    expect(me.body.role).toBe('owner');
    expect(me.body.shopId).toBe(shopId);
    expect((await request(app).post('/api/products').set(auth('staff')).send({})).status).toBe(403);
  });
  test('AC11: shop A cannot read or change shop B data', async () => {
    await fixtures();
    const otherShop = await Shop.create({ name: 'Other', slug: 'other' });
    const other = await Product.create({
      shopId: otherShop.id,
      name: 'Other',
      sku: 'OTHER',
      pricePaise: 100,
      stock: 8,
    });
    expect((await request(app).get('/api/products').set(auth())).body.total).toBe(1);
    expect(
      (await request(app).patch(`/api/products/${other.id}`).set(auth()).send({ name: 'Changed' }))
        .status,
    ).toBe(404);
    const otherOrder = await Order.create({
      shopId: otherShop.id,
      code: 'MC-0001',
      items: [],
      channel: 'other',
      customerName: 'Demo',
      customerPhone: '9999999999',
      subtotalPaise: 0,
    });
    expect((await request(app).get(`/api/orders/${otherOrder.id}`).set(auth())).status).toBe(404);
    expect(
      (
        await request(app)
          .patch(`/api/orders/${otherOrder.id}/status`)
          .set(auth('staff'))
          .send({ to: 'packed' })
      ).status,
    ).toBe(404);
    expect((await Product.findById(other.id))?.stock).toBe(8);
  });
});
describe('Products and stock ledger', () => {
  test('AC12: strict validation rejects stock edits, unknown keys and invalid paging', async () => {
    await fixtures();
    const response = await request(app)
      .patch(`/api/products/${productId}`)
      .set(auth())
      .send({ stock: 99 });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect((await Product.findById(productId))?.stock).toBe(3);
    expect((await request(app).get('/api/products?limit=51').set(auth())).status).toBe(400);
    expect((await request(app).get('/api/products?shopId=other').set(auth())).status).toBe(400);
  });
  test('AC13: duplicate SKU is a 409; search handles regex characters literally', async () => {
    await fixtures();
    const response = await request(app)
      .post('/api/products')
      .set(auth())
      .send({ name: 'Other', sku: 'RAGI-01', pricePaise: 100, lowStockThreshold: 2 });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DUPLICATE_SKU');
    expect((await request(app).get('/api/products?q=%5B').set(auth())).status).toBe(200);
  });
  test('AC29: editing a name preserves the existing stock threshold', async () => {
    await fixtures();
    await Product.setThreshold(productId, 17);
    const response = await request(app)
      .patch(`/api/products/${productId}`)
      .set(auth())
      .send({ name: 'Fresh Ragi Cookies' });
    expect(response.status).toBe(200);
    expect(response.body.lowStockThreshold).toBe(17);
    expect(response.body.stock).toBe(3);
  });
  test('AC30: concurrent receipt retries increment stock once and conflicting content is rejected', async () => {
    await fixtures();
    const key = 'c0c0c0c0-1234-4234-8234-c0c0c0c0c0c0';
    const responses = await Promise.all(
      [0, 1].map(() =>
        request(app)
          .post(`/api/products/${productId}/movements`)
          .set(auth('staff'))
          .set('Idempotency-Key', key)
          .send({ qty: 2 }),
      ),
    );
    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    expect((await Product.findById(productId))?.stock).toBe(5);
    expect(await InventoryMovement.count({ type: 'receive' })).toBe(1);
    expect(
      (
        await request(app)
          .post(`/api/products/${productId}/movements`)
          .set(auth('staff'))
          .set('Idempotency-Key', key)
          .send({ qty: 3 })
      ).status,
    ).toBe(409);
    expect((await Product.findById(productId))?.stock).toBe(5);
  });
  test('AC14: receive stock creates exactly one ledger entry and honors retry keys', async () => {
    await fixtures();
    const key = 'b0b0b0b0-1234-4234-8234-b0b0b0b0b0b0';
    for (let n = 0; n < 2; n++) {
      expect(
        (
          await request(app)
            .post(`/api/products/${productId}/movements`)
            .set(auth('staff'))
            .set('Idempotency-Key', key)
            .send({ qty: 4, note: 'Demo delivery' })
        ).status,
      ).toBe(201);
    }
    expect((await Product.findById(productId))?.stock).toBe(7);
    expect(await InventoryMovement.count({ productId, type: 'receive' })).toBe(1);
  });
});
describe('Order reservation and transitions', () => {
  test('AC15: reserve uses DB prices, merges repeated products, and writes a ledger', async () => {
    await fixtures(5);
    const response = await request(app)
      .post('/api/orders')
      .set(auth())
      .send({
        ...payload(),
        items: [
          { productId, qty: 1 },
          { productId, qty: 2 },
        ],
      });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('pending');
    expect(response.body.subtotalPaise).toBe(54000);
    expect(response.body.items).toHaveLength(1);
    expect((await Product.findById(productId))?.stock).toBe(2);
    expect(await InventoryMovement.count({ productId, type: 'reserve' })).toBe(1);
    expect((await request(app).post('/api/orders').set(auth('staff')).send(payload())).status).toBe(
      403,
    );
    expect(
      (
        await request(app)
          .post('/api/orders')
          .set(auth())
          .send({ ...payload(), subtotalPaise: 1 })
      ).status,
    ).toBe(400);
  });
  test('AC16: insufficient stock rolls back all products, order and movements', async () => {
    await fixtures(1);
    const second = await Product.create({
      shopId,
      sku: 'SECOND',
      name: 'Second',
      pricePaise: 100,
      stock: 0,
    });
    const response = await request(app)
      .post('/api/orders')
      .set(auth())
      .send({
        ...payload(),
        items: [
          { productId, qty: 1 },
          { productId: second.id, qty: 1 },
        ],
      });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect((await Product.findById(productId))?.stock).toBe(1);
    expect(await Order.count()).toBe(0);
    expect(await InventoryMovement.count()).toBe(0);
  });
  test('AC17: simultaneous buyers cannot oversell the last unit', async () => {
    await fixtures(1);
    const responses = await Promise.all([
      request(app).post('/api/orders').set(auth()).send(payload()),
      request(app).post('/api/orders').set(auth()).send(payload()),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect((await Product.findById(productId))?.stock).toBe(0);
    expect(await Order.count()).toBe(1);
    expect(await InventoryMovement.count({ type: 'reserve' })).toBe(1);
  });
  test('AC18: concurrent idempotent retries reserve once and conflicting reuse is rejected', async () => {
    await fixtures(3);
    const key = 'a0a0a0a0-1234-4234-8234-a0a0a0a0a0a0';
    const responses = await Promise.all(
      [0, 1].map(() =>
        request(app).post('/api/orders').set(auth()).set('Idempotency-Key', key).send(payload()),
      ),
    );
    expect(responses.map((r) => r.status)).toEqual([201, 201]);
    expect(responses[0]?.body._id).toBe(responses[1]?.body._id);
    expect((await Product.findById(productId))?.stock).toBe(2);
    expect(await Order.count()).toBe(1);
    expect(
      (
        await request(app)
          .post('/api/orders')
          .set(auth())
          .set('Idempotency-Key', key)
          .send(payload(2))
      ).status,
    ).toBe(409);
  });
  test('AC19: illegal transitions return 409; concurrent cancellation restocks only once', async () => {
    await fixtures(2);
    const created = await request(app).post('/api/orders').set(auth()).send(payload());
    const url = `/api/orders/${created.body._id}/status`;
    expect((await request(app).patch(url).set(auth('staff')).send({ to: 'shipped' })).status).toBe(
      409,
    );
    expect(
      (await request(app).patch(url).set(auth('staff')).send({ to: 'cancelled' })).status,
    ).toBe(403);
    const responses = await Promise.all(
      [0, 1].map(() => request(app).patch(url).set(auth()).send({ to: 'cancelled' })),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect((await Product.findById(productId))?.stock).toBe(2);
    expect(await InventoryMovement.count({ type: 'restock' })).toBe(1);
  });
  test('AC20: staff responses contain no prices, customer phone, or revenue', async () => {
    await fixtures();
    const created = await request(app).post('/api/orders').set(auth()).send(payload());
    const response = await request(app).get(`/api/orders/${created.body._id}`).set(auth('staff'));
    expect(response.status).toBe(200);
    expect(response.body.subtotalPaise).toBeUndefined();
    expect(response.body.customerPhone).toBeUndefined();
    expect(response.body.items[0].unitPricePaise).toBeUndefined();
    expect((await request(app).get('/api/dashboard?range=7d').set(auth('staff'))).status).toBe(403);
    const products = await request(app).get('/api/products').set(auth('staff'));
    expect(products.body.items[0].pricePaise).toBeUndefined();
  });
  test('AC21: archived products cannot be ordered but can be restocked on cancellation', async () => {
    await fixtures();
    const created = await request(app).post('/api/orders').set(auth()).send(payload());
    await request(app).delete(`/api/products/${productId}`).set(auth());
    expect((await request(app).post('/api/orders').set(auth()).send(payload())).status).toBe(409);
    expect(
      (
        await request(app)
          .patch(`/api/orders/${created.body._id}/status`)
          .set(auth())
          .send({ to: 'cancelled' })
      ).status,
    ).toBe(200);
    expect((await Product.findById(productId))?.stock).toBe(3);
  });
});
