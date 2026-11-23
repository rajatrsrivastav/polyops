import { connectDatabase, disconnectDatabase } from '../../src/db/pool';
import { ensureSchema } from '../../src/db/schema';
import { createLogger } from '../../src/lib/logger';
const logger = createLogger();
async function run() {
  if (!process.env.DATABASE_URL || process.env.CONFIRM_INDEX_MIGRATION !== 'packbay')
    throw new Error('DATABASE_URL and CONFIRM_INDEX_MIGRATION are required');
  await connectDatabase(process.env.DATABASE_URL);
  try {
    // Use the direct Neon URL for this command. Pooled connections can reject schema changes.
    await ensureSchema();
    logger.info('Schema ensured without dropping existing tables');
  } finally {
    await disconnectDatabase();
  }
}
void run().catch(() => {
  logger.error('Schema migration failed; check duplicate data and deployment logs');
  process.exitCode = 1;
});
