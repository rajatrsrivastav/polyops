import { readConfig } from '../../src/config';
import { connectDatabase, disconnectDatabase, query, transaction } from '../../src/db/pool';
import { ensureSchema } from '../../src/db/schema';
import { createLogger } from '../../src/lib/logger';
import { AiBrief, Counter, InventoryMovement, Order, Product, Shop, User } from '../../src/models';
import { deleteAuthUser, disableAuthUser } from '../../src/services/identity';
const logger = createLogger();
const db = { query };
async function run() {
  const slug = process.argv.find((arg) => arg.startsWith('--shop='))?.slice(7);
  if (!slug || !process.argv.includes(`--confirm=${slug}`))
    throw new Error('Use --shop=slug --confirm=slug after a backup and a verified deletion request');
  const config = readConfig(process.env);
  await connectDatabase(config.DATABASE_URL);
  try {
    await ensureSchema();
    const shop = await Shop.findBySlug(slug);
    if (!shop) throw new Error('Shop not found');
    const users = await User.findByShop(shop._id);
    for (const user of users) await disableAuthUser(db, user.authUserId);
    await transaction(async (tx) => {
      await Product.deleteByShop(shop._id, tx);
      await Order.deleteByShop(shop._id, tx);
      await InventoryMovement.deleteByShop(shop._id, tx);
      await Counter.deleteByShop(shop._id, tx);
      await AiBrief.deleteByShop(shop._id, tx);
    });
    for (const user of users) await deleteAuthUser(db, user.authUserId);
    await transaction(async (tx) => {
      await User.deleteByShop(shop._id, tx);
      await Shop.deleteById(shop._id, tx);
    });
    logger.info('Shop and identities removed. Apply the documented backup expiry policy.');
  } finally {
    await disconnectDatabase();
  }
}
void run().catch((error) => {
  logger.error(
    { errorType: error instanceof Error ? error.name : 'UnknownError' },
    'Deletion stopped; keep the request open and review auth accounts and backup state',
  );
  process.exitCode = 1;
});
