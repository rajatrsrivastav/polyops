import mongoose from 'mongoose';
import { getAuth } from 'firebase-admin/auth';
import { readConfig } from '../../src/config';
import { initFirebase } from '../../src/lib/firebase';
import { createLogger } from '../../src/lib/logger';
import { Shop, User, Product, Order, InventoryMovement, Counter, AiBrief } from '../../src/models';
const logger = createLogger();
async function run() {
  const slug = process.argv.find((arg) => arg.startsWith('--shop='))?.slice(7);
  if (!slug || !process.argv.includes(`--confirm=${slug}`))
    throw new Error(
      'Use --shop=slug --confirm=slug after a backup and a verified deletion request',
    );
  const config = readConfig(process.env);
  initFirebase(config);
  await mongoose.connect(config.MONGO_URI);
  try {
    const shop = await Shop.findOne({ slug });
    if (!shop) throw new Error('Shop not found');
    const users = await User.find({ shopId: shop._id }).lean();
    // Disable identities before deleting business data. Any failure stops removal for operator review.
    for (const user of users) {
      try {
        await getAuth().updateUser(user.firebaseUid, { disabled: true });
      } catch (error) {
        const code =
          typeof error === 'object' && error !== null && 'code' in error ? error.code : '';
        if (code !== 'auth/user-not-found') throw error;
      }
    }
    await mongoose.connection.transaction(async (session) => {
      for (const remove of [
        () => Product.deleteMany({ shopId: shop._id }, { session }),
        () => Order.deleteMany({ shopId: shop._id }, { session }),
        () => InventoryMovement.deleteMany({ shopId: shop._id }, { session }),
        () => Counter.deleteMany({ shopId: shop._id }, { session }),
        () => AiBrief.deleteMany({ shopId: shop._id }, { session }),
      ])
        await remove();
    });
    // Keep User + Shop records until all remote deletions succeed, so rerunning is safe.
    for (const user of users) {
      try {
        await getAuth().deleteUser(user.firebaseUid);
      } catch (error) {
        const code =
          typeof error === 'object' && error !== null && 'code' in error ? error.code : '';
        if (code !== 'auth/user-not-found') throw error;
      }
    }
    await mongoose.connection.transaction(async (session) => {
      await User.deleteMany({ shopId: shop._id }, { session });
      await Shop.deleteOne({ _id: shop._id }, { session });
    });
    logger.info('Shop and identities removed. Apply the documented backup expiry policy.');
  } finally {
    await mongoose.disconnect();
  }
}
void run().catch((error) => {
  logger.error(
    { errorType: error instanceof Error ? error.name : 'UnknownError' },
    'Deletion stopped; keep the request open and review Firebase and backup state',
  );
  process.exitCode = 1;
});
