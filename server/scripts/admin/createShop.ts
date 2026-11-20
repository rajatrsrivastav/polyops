import { z } from 'zod';
import { readConfig } from '../../src/config';
import { connectDatabase, disconnectDatabase, transaction } from '../../src/db/pool';
import { ensureSchema } from '../../src/db/schema';
import { createLogger } from '../../src/lib/logger';
import { Shop, User } from '../../src/models';
import { insertAuthUser } from '../../src/services/identity';
const logger = createLogger();
function argumentsOf() {
  return Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, ...values] = arg.replace(/^--/, '').split('=');
      return [key, values.join('=')];
    }),
  );
}
async function run() {
  const raw = argumentsOf();
  if (typeof raw.ownerPassword === 'string' && raw.ownerPassword.length < 8)
    throw new Error('Owner password must be at least 8 characters');
  if (typeof raw.staffPassword === 'string' && raw.staffPassword.length < 8)
    throw new Error('Staff password must be at least 8 characters');
  const options = z
    .object({
      name: z.string().min(1).max(100),
      slug: z.string().regex(/^[a-z0-9-]{2,60}$/),
      ownerEmail: z.email(),
      staffEmail: z.email(),
      ownerPassword: z.string().min(8),
      staffPassword: z.string().min(8),
    })
    .parse(raw);
  if (options.ownerEmail.toLowerCase() === options.staffEmail.toLowerCase())
    throw new Error('Use distinct owner and staff emails');
  const config = readConfig(process.env);
  await connectDatabase(config.DATABASE_URL);
  try {
    await ensureSchema();
    if (await Shop.findBySlug(options.slug)) throw new Error('Shop slug already exists');
    await transaction(async (tx) => {
      const shop = await Shop.create({ name: options.name, slug: options.slug }, tx);
      const ownerId = await insertAuthUser(tx, {
        email: options.ownerEmail,
        name: `${options.name} owner`,
        password: options.ownerPassword,
      });
      const staffId = await insertAuthUser(tx, {
        email: options.staffEmail,
        name: `${options.name} staff`,
        password: options.staffPassword,
      });
      await User.create(
        { authUserId: ownerId, shopId: shop._id, role: 'owner', email: options.ownerEmail },
        tx,
      );
      await User.create(
        { authUserId: staffId, shopId: shop._id, role: 'staff', email: options.staffEmail },
        tx,
      );
    });
    logger.info('Shop provisioned. Passwords were accepted from arguments and were not logged.');
  } finally {
    await disconnectDatabase();
  }
}
void run().catch((error) => {
  logger.error(
    { errorType: error instanceof Error ? error.name : 'UnknownError' },
    'Shop creation failed; inspect duplicate accounts and required argument names',
  );
  process.exitCode = 1;
});
