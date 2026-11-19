import mongoose from 'mongoose';
import { Shop, User, Product, Order, InventoryMovement, Counter, AiBrief } from '../../src/models';
import { createLogger } from '../../src/lib/logger';
const logger = createLogger();
async function run() {
  if (!process.env.MONGO_URI || process.env.CONFIRM_INDEX_MIGRATION !== 'packbay')
    throw new Error('MONGO_URI and CONFIRM_INDEX_MIGRATION are required');
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  try {
    for (const model of [Shop, User, Product, Order, InventoryMovement, Counter, AiBrief])
      await model.createIndexes();
    logger.info('Indexes created without dropping existing indexes');
  } finally {
    await mongoose.disconnect();
  }
}
void run().catch(() => {
  logger.error('Index migration failed; check duplicate data and deployment logs');
  process.exitCode = 1;
});
