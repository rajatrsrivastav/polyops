import mongoose from 'mongoose';
import { seed } from '../scripts/seed';
import { Shop, Product, Order, InventoryMovement } from '../src/models';
import { testDatabaseUri, reconnectTestDatabase } from './setup';
const variables = [
  'MONGO_URI',
  'DEMO_OWNER_UID',
  'DEMO_STAFF_ONE_UID',
  'DEMO_STAFF_TWO_UID',
  'NODE_ENV',
];
const saved = new Map(variables.map((name) => [name, process.env[name]]));
afterAll(() => {
  for (const name of variables) {
    const value = saved.get(name);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});
test('AC31: deterministic demo seed preserves other shops and every stock balance reconciles', async () => {
  process.env.MONGO_URI = testDatabaseUri();
  process.env.DEMO_OWNER_UID = 'synthetic-owner';
  process.env.DEMO_STAFF_ONE_UID = 'synthetic-staff-one';
  process.env.DEMO_STAFF_TWO_UID = 'synthetic-staff-two';
  const pilot = await Shop.create({ name: 'Synthetic untouched shop', slug: 'untouched' });
  const untouched = await Product.create({
    shopId: pilot._id,
    sku: 'SAFE',
    name: 'Demo untouched',
    pricePaise: 100,
    stock: 0,
  });
  await seed();
  await reconnectTestDatabase();
  const shop = await Shop.findOne({ slug: 'millet-co' });
  expect(shop?.isDemo).toBe(true);
  expect(await Product.countDocuments({ shopId: shop?._id })).toBe(20);
  expect(await Order.countDocuments({ shopId: shop?._id })).toBe(120);
  const first = await Order.aggregate([
    { $match: { shopId: shop?._id } },
    { $group: { _id: null, total: { $sum: '$subtotalPaise' } } },
  ]);
  for (const product of await Product.find({ shopId: shop?._id })) {
    const movements = await InventoryMovement.find({ productId: product._id }).lean();
    const balance = movements.reduce(
      (total, movement) => total + (movement.type === 'reserve' ? -movement.qty : movement.qty),
      0,
    );
    expect(product.stock).toBe(balance);
    expect(balance).toBeGreaterThanOrEqual(0);
  }
  await seed();
  await reconnectTestDatabase();
  expect(await Order.countDocuments({ shopId: shop?._id })).toBe(120);
  const second = await Order.aggregate([
    { $match: { shopId: shop?._id } },
    { $group: { _id: null, total: { $sum: '$subtotalPaise' } } },
  ]);
  expect(first).toEqual(second);
  expect(await Product.exists({ _id: untouched._id })).not.toBeNull();
  expect(await Shop.exists({ _id: pilot._id })).not.toBeNull();
});
test('AC32: production seed without explicit demo flags is refused before connecting', async () => {
  process.env.MONGO_URI = testDatabaseUri();
  process.env.DEMO_OWNER_UID = 'synthetic-owner';
  process.env.DEMO_STAFF_ONE_UID = 'synthetic-staff-one';
  process.env.DEMO_STAFF_TWO_UID = 'synthetic-staff-two';
  process.env.NODE_ENV = 'production';
  await expect(seed()).rejects.toThrow('Production seed requires');
  expect(mongoose.connection.readyState).toBe(1);
  process.env.NODE_ENV = saved.get('NODE_ENV') ?? 'test';
});
