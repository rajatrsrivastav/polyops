import mongoose from 'mongoose';
import { z } from 'zod';
import { Shop, User, Product, Order, InventoryMovement, Counter, AiBrief } from '../src/models';
import { receiveStock } from '../src/services/stock';
import { createOrder } from '../src/services/orders';
import { changeOrderStatus } from '../src/services/orderStatus';
import { dayStart } from '../src/lib/time';
import { createLogger } from '../src/lib/logger';
const logger = createLogger();
export async function seed() {
  const env = z
    .object({
      MONGO_URI: z.string().min(1),
      DEMO_OWNER_UID: z.string().min(1),
      DEMO_STAFF_ONE_UID: z.string().min(1),
      DEMO_STAFF_TWO_UID: z.string().min(1),
      DEMO_SEED_END_DATE: z.iso.date().default('2026-11-19'),
    })
    .parse(process.env);
  if (new Set([env.DEMO_OWNER_UID, env.DEMO_STAFF_ONE_UID, env.DEMO_STAFF_TWO_UID]).size !== 3)
    throw new Error('Demo Firebase UIDs must be distinct');
  if (
    process.env.NODE_ENV === 'production' &&
    !(process.argv.includes('--demo-only') && process.argv.includes('--shop=millet-co'))
  )
    throw new Error('Production seed requires --demo-only --shop=millet-co');
  await mongoose.connect(env.MONGO_URI);
  try {
    const current = await Shop.findOne({ slug: 'millet-co' });
    if (current && !current.isDemo) throw new Error('Refusing to modify a non-demo shop');
    const shop =
      current ?? (await Shop.create({ name: 'Millet & Co.', slug: 'millet-co', isDemo: true }));
    if (
      await User.exists({
        firebaseUid: { $in: [env.DEMO_OWNER_UID, env.DEMO_STAFF_ONE_UID, env.DEMO_STAFF_TWO_UID] },
        shopId: { $ne: shop._id },
      })
    )
      throw new Error('A demo Firebase UID belongs to another shop');
    await mongoose.connection.transaction(async (session) => {
      for (const remove of [
        () => User.deleteMany({ shopId: shop._id }, { session }),
        () => Product.deleteMany({ shopId: shop._id }, { session }),
        () => Order.deleteMany({ shopId: shop._id }, { session }),
        () => InventoryMovement.deleteMany({ shopId: shop._id }, { session }),
        () => Counter.deleteMany({ shopId: shop._id }, { session }),
        () => AiBrief.deleteMany({ shopId: shop._id }, { session }),
      ])
        await remove();
    });
    await Promise.all([
      Product.createIndexes(),
      Order.createIndexes(),
      Counter.createIndexes(),
      InventoryMovement.createIndexes(),
      AiBrief.createIndexes(),
      User.createIndexes(),
    ]);
    const [owner] = await User.create([
      {
        firebaseUid: env.DEMO_OWNER_UID,
        shopId: shop._id,
        email: 'owner@millet.example',
        role: 'owner',
      },
      {
        firebaseUid: env.DEMO_STAFF_ONE_UID,
        shopId: shop._id,
        email: 'packer-one@millet.example',
        role: 'staff',
      },
      {
        firebaseUid: env.DEMO_STAFF_TWO_UID,
        shopId: shop._id,
        email: 'packer-two@millet.example',
        role: 'staff',
      },
    ]);
    if (!owner) throw new Error('Demo owner missing');
    const actor = {
      id: owner._id,
      shopId: shop._id,
      role: 'owner' as const,
      firebaseUid: owner.firebaseUid,
    };
    const names = [
      'Ragi Cookies',
      'Jowar Puffs',
      'Millet Granola',
      'Bajra Crackers',
      'Little Millet Mix',
      'Foxtail Breakfast',
      'Ragi Brownie Mix',
      'Kodo Trail Mix',
      'Barnyard Flour',
      'Amaranth Laddoo',
      'Sesame Bites',
      'Cocoa Millet Bars',
      'Moringa Crackers',
      'Peanut Chikki',
      'Coconut Cookies',
      'Date Energy Bites',
      'Spiced Jowar',
      'Honey Granola',
      'Roasted Millet',
      'Family Snack Box',
    ];
    const catalog = [];
    for (const [index, name] of names.entries()) {
      const product = await Product.create({
        shopId: shop._id,
        name,
        sku: `MC-${String(index + 1).padStart(3, '0')}`,
        pricePaise: 12000 + index * 1500,
        lowStockThreshold: 20,
      });
      await receiveStock(actor, product.id, {
        qty: index < 3 ? 20 : 500,
        note: 'Synthetic opening stock',
      });
      catalog.push(product);
    }
    const end = dayStart(env.DEMO_SEED_END_DATE);
    await InventoryMovement.updateMany(
      { shopId: shop._id, type: 'receive' },
      {
        $set: {
          createdAt: new Date(end.getTime() - 60 * 86400000),
          updatedAt: new Date(end.getTime() - 60 * 86400000),
        },
      },
      { timestamps: false },
    );
    for (let day = 59; day >= 0; day--) {
      for (let slot = 0; slot < 2; slot++) {
        const index = (day * 7 + slot * 3) % catalog.length;
        const product = catalog[index];
        if (!product) throw new Error('Seed catalog missing');
        const order = await createOrder(actor, {
          items: [{ productId: product.id, qty: 1 + ((day + slot) % 2) }],
          channel: slot ? 'whatsapp' : 'instagram',
          customerName: `Demo Customer ${String(day * 2 + slot + 1).padStart(3, '0')}`,
          customerPhone: '9999999999',
        });
        if (!order) throw new Error('Seed order missing');
        const cancelled = day % 13 === 0 && day > 0;
        if (cancelled) await changeOrderStatus(actor, order.id, 'cancelled');
        else if (day > 0) {
          await changeOrderStatus(actor, order.id, 'packed');
          await changeOrderStatus(actor, order.id, 'shipped');
          if (day > 2) await changeOrderStatus(actor, order.id, 'delivered');
        }
        const at = new Date(end.getTime() - day * 86400000 + (10 + slot * 4) * 3600000);
        const saved = await Order.findById(order._id);
        if (!saved) throw new Error('Seed order missing after status update');
        await Order.updateOne(
          { _id: order._id, shopId: shop._id },
          {
            $set: {
              createdAt: at,
              updatedAt: at,
              statusHistory: saved.statusHistory.map((entry, n) => ({
                status: entry.status,
                userId: entry.userId,
                at: new Date(at.getTime() + n * 60000),
              })),
            },
          },
          { timestamps: false },
        );
        await InventoryMovement.updateMany(
          { shopId: shop._id, orderId: order._id },
          { $set: { createdAt: at, updatedAt: at } },
          { timestamps: false },
        );
      }
    }
    logger.info(
      {
        shopId: String(shop._id),
        products: catalog.length,
        orders: await Order.countDocuments({ shopId: shop._id }),
      },
      'Synthetic demo seed complete; never report as real usage',
    );
  } finally {
    await mongoose.disconnect();
  }
}
if (require.main === module)
  void seed().catch((error) => {
    logger.error(
      { errorType: error instanceof Error ? error.name : 'UnknownError' },
      'Demo seed failed; check required environment names and demo-only guard',
    );
    process.exitCode = 1;
  });
