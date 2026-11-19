import mongoose from 'mongoose';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { readConfig } from '../../src/config';
import { initFirebase } from '../../src/lib/firebase';
import { createLogger } from '../../src/lib/logger';
import { Shop, User } from '../../src/models';
const logger = createLogger();
async function run() {
  const options = z
    .object({
      name: z.string().min(1).max(100),
      slug: z.string().regex(/^[a-z0-9-]{2,60}$/),
      ownerEmail: z.email(),
      staffEmail: z.email(),
    })
    .parse(
      Object.fromEntries(
        process.argv.slice(2).map((arg) => {
          const [key, ...values] = arg.replace(/^--/, '').split('=');
          return [key, values.join('=')];
        }),
      ),
    );
  const config = readConfig(process.env);
  initFirebase(config);
  await mongoose.connect(config.MONGO_URI);
  const createdUids: string[] = [];
  try {
    if (options.ownerEmail === options.staffEmail)
      throw new Error('Use distinct owner and staff emails');
    if (await Shop.exists({ slug: options.slug })) throw new Error('Shop slug already exists');
    const firebase = getAuth();
    const owner = await firebase.createUser({ email: options.ownerEmail });
    createdUids.push(owner.uid);
    const staff = await firebase.createUser({ email: options.staffEmail });
    createdUids.push(staff.uid);
    await mongoose.connection.transaction(async (session) => {
      const [shop] = await Shop.create([{ name: options.name, slug: options.slug }], { session });
      if (!shop) throw new Error('Shop creation failed');
      await User.create(
        [
          { firebaseUid: owner.uid, shopId: shop._id, role: 'owner', email: options.ownerEmail },
          { firebaseUid: staff.uid, shopId: shop._id, role: 'staff', email: options.staffEmail },
        ],
        { session },
      );
    });
    logger.info(
      'Shop provisioned. Send password resets through Firebase Console; no passwords or reset links are stored or logged.',
    );
  } catch (error) {
    for (const uid of createdUids) {
      try {
        await getAuth().deleteUser(uid);
      } catch {
        logger.error(
          'Firebase cleanup failed; review recently created accounts in Firebase Console',
        );
      }
    }
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}
void run().catch((error) => {
  logger.error(
    { errorType: error instanceof Error ? error.name : 'UnknownError' },
    'Shop creation failed; inspect duplicate accounts and required argument names',
  );
  process.exitCode = 1;
});
