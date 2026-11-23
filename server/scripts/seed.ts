import { readSeedConfig, SeedConfigError } from './seedConfig';
import { connectDatabase, databaseReadyState, disconnectDatabase, transaction } from '../src/db/pool';
import { ensureSchema } from '../src/db/schema';
import { Order, Product, Shop, User } from '../src/models';
import { AiBrief, Counter, InventoryMovement } from '../src/models';
import { deleteAuthUser, insertAuthUser } from '../src/services/identity';
import { receiveStock } from '../src/services/stock';
import { createOrder } from '../src/services/orders';
import { changeOrderStatus } from '../src/services/orderStatus';
import { dayStart } from '../src/lib/time';
import { createLogger } from '../src/lib/logger';
import { query } from '../src/db/pool';
const logger = createLogger();
const db = { query };
export async function seed(
  options: { requirePasswords?: boolean; reportProgress?: boolean; quick?: boolean } = {},
) {
  const env = readSeedConfig(process.env, options.requirePasswords ?? false);
  if (
    process.env.NODE_ENV === 'production' &&
    !(process.argv.includes('--demo-only') && process.argv.includes('--shop=millet-co'))
  )
    throw new Error('Production seed requires --demo-only --shop=millet-co');
  const opened = databaseReadyState() !== 1;
  const report = (message: string) => {
    if (options.reportProgress) logger.info(message);
  };
  try {
    if (opened) {
      if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required');
      report('Connecting to Postgres for demo seed');
      await connectDatabase(env.DATABASE_URL, { connectionTimeoutMillis: 15000 });
    }
    report('Checking demo shop and database schema');
    await ensureSchema();
    const current = await Shop.findBySlug('millet-co');
    if (current && !current.isDemo) throw new Error('Refusing to modify a non-demo shop');
    const shop =
      current ?? (await Shop.create({ name: 'PolyOps Demo Works', slug: 'millet-co', isDemo: true }));
    if (
      (await User.countOutsideShop(
        [env.DEMO_OWNER_UID, env.DEMO_STAFF_ONE_UID, env.DEMO_STAFF_TWO_UID],
        shop._id,
      )) > 0
    )
      throw new Error('A demo identity belongs to another shop');
    report('Replacing demo shop data and provisioning demo sign-in accounts');
    await transaction(async (tx) => {
      await tx.query("UPDATE shops SET name = $1, updated_at = now() WHERE id = $2 AND is_demo", [
        'PolyOps Demo Works', shop._id,
      ]);
      await User.deleteByShop(shop._id, tx);
      await Product.deleteByShop(shop._id, tx);
      await Order.deleteByShop(shop._id, tx);
      await InventoryMovement.deleteByShop(shop._id, tx);
      await Counter.deleteByShop(shop._id, tx);
      await AiBrief.deleteByShop(shop._id, tx);
    });
    const identities = [
      {
        id: env.DEMO_OWNER_UID,
        email: 'owner@millet.example',
        name: 'Factory owner',
        password: env.DEMO_OWNER_PASSWORD,
        role: 'owner' as const,
      },
      {
        id: env.DEMO_STAFF_ONE_UID,
        email: 'packer-one@millet.example',
        name: 'Dispatch operator one',
        password: env.DEMO_STAFF_ONE_PASSWORD,
        role: 'staff' as const,
      },
      {
        id: env.DEMO_STAFF_TWO_UID,
        email: 'packer-two@millet.example',
        name: 'Dispatch operator two',
        password: env.DEMO_STAFF_TWO_PASSWORD,
        role: 'staff' as const,
      },
    ];
    for (const identity of identities) await deleteAuthUser(db, identity.id);
    const owner = await transaction(async (tx) => {
      const created = [];
      for (const identity of identities) {
        await insertAuthUser(tx, identity);
        created.push(
          await User.create(
            {
              authUserId: identity.id,
              shopId: shop._id,
              email: identity.email,
              role: identity.role,
            },
            tx,
          ),
        );
      }
      return created[0];
    });
    if (!owner) throw new Error('Demo owner missing');
    const actor = {
      id: owner._id,
      shopId: shop._id,
      role: 'owner' as const,
      authUserId: owner.authUserId,
    };
    const names = [
      'HDPE Natural Granules',
      'PP Black Granules',
      'PET Clear Flakes',
      'LDPE Film Regrind',
      'PP Copolymer Granules',
      'HDPE Blue Regrind',
      'ABS Black Granules',
      'PET Green Flakes',
      'LDPE Natural Granules',
      'LLDPE Film Granules',
      'PP White Regrind',
      'HDPE Black Granules',
      'ABS Natural Regrind',
      'PET Blue Flakes',
      'PP Grey Granules',
      'HIPS White Regrind',
      'HDPE Drum Regrind',
      'PC Clear Regrind',
      'PP Raffia Granules',
      'LDPE Black Granules',
    ];
    const buyers = ['Demo Pipe Works', 'Demo Moulding Works', 'Demo Film Industries'];
    const channels = ['purchase_order', 'phone', 'email'] as const;
    const selectedNames = options.quick ? names.slice(0, 8) : names;
    const days = options.quick ? 7 : 60;
    const totalOrders = days * 2;
    const catalog = [];
    report(`Creating ${selectedNames.length} demo materials and their opening stock`);
    for (const [index, name] of selectedNames.entries()) {
      const product = await Product.create({
        shopId: shop._id,
        name,
        sku: `POLY-${String(index + 1).padStart(3, '0')}`,
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
    await InventoryMovement.stampShop(shop._id, 'receive', new Date(end.getTime() - days * 86400000));
    report(`Creating ${totalOrders} synthetic orders`);
    for (let day = days - 1; day >= 0; day--) {
      for (let slot = 0; slot < 2; slot++) {
        const index = (day * 7 + slot * 3) % catalog.length;
        const product = catalog[index];
        const customerName = buyers[(day + slot) % buyers.length];
        const channel = channels[(day + slot) % channels.length];
        if (!product || !customerName || !channel) throw new Error('Seed fixture missing');
        const order = await createOrder(actor, {
          items: [{ productId: product.id, qty: 1 + ((day + slot) % 2) }],
          channel,
          customerName,
          customerPhone: '9999999999',
        });
        const cancelled = day % 13 === 0 && day > 0;
        let saved = order;
        if (cancelled) saved = await changeOrderStatus(actor, order.id, 'cancelled');
        else if (day > 0) {
          await changeOrderStatus(actor, order.id, 'packed');
          saved = await changeOrderStatus(actor, order.id, 'shipped');
          if (day > 2) saved = await changeOrderStatus(actor, order.id, 'delivered');
        }
        const at = new Date(end.getTime() - day * 86400000 + (10 + slot * 4) * 3600000);
        await Order.replaceSchedule(saved._id, shop._id, {
          createdAt: at,
          updatedAt: at,
          statusHistory: saved.statusHistory.map((entry, n) => ({
            status: entry.status,
            userId: entry.userId,
            at: new Date(at.getTime() + n * 60000),
          })),
        });
        await InventoryMovement.stampOrder(shop._id, saved._id, at);
      }
      const completed = (days - day) * 2;
      if (completed === totalOrders || completed % (options.quick ? 4 : 20) === 0)
        report(`Created ${completed} of ${totalOrders} synthetic orders`);
    }
    logger.info(
      {
        shopId: shop._id,
        products: catalog.length,
        orders: await Order.count(shop._id),
      },
      'Synthetic demo seed complete; never report as real usage',
    );
  } finally {
    if (opened) await disconnectDatabase();
  }
}
if (require.main === module)
  void seed({ requirePasswords: true, reportProgress: true, quick: process.argv.includes('--quick') }).catch((error) => {
    logger.error(
      { errorType: error instanceof Error ? error.name : 'UnknownError', reason: error instanceof SeedConfigError ? error.message : undefined },
      'Demo seed failed; check required environment names and demo-only guard',
    );
    process.exitCode = 1;
  });
