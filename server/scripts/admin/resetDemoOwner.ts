import { z } from 'zod';
import { connectDatabase, disconnectDatabase, transaction } from '../../src/db/pool';
import { createLogger } from '../../src/lib/logger';
import { hashSecret } from '../../src/services/identity';

const logger = createLogger();
const demoEmail = 'owner@millet.example';
class RecoveryError extends Error {}

export async function resetDemoOwner(password: string) {
  if (!z.string().min(8).max(128).safeParse(password).success)
    throw new RecoveryError('Set DEMO_OWNER_PASSWORD to 8–128 characters.');

  const hash = await hashSecret(password);
  await transaction(async (tx) => {
    const owner = await tx.query(
      `SELECT u.auth_user_id FROM users u
       JOIN shops s ON s.id = u.shop_id
       JOIN "user" a ON a.id = u.auth_user_id
       WHERE s.slug = 'millet-co' AND s.is_demo = TRUE AND u.role = 'owner'
         AND u.email = $1 AND a.email = $1
       FOR UPDATE OF s, u, a`,
      [demoEmail],
    );
    const id = owner.rows[0]?.auth_user_id;
    if (owner.rows.length !== 1 || typeof id !== 'string')
      throw new RecoveryError('The seeded factory demo owner was not found.');
    const result = await tx.query(
      `UPDATE "account" SET password = $2, "updatedAt" = now()
       WHERE "userId" = $1 AND "accountId" = $1 AND "providerId" = 'credential'`,
      [id, hash],
    );
    if (result.rowCount !== 1) throw new RecoveryError('Expected exactly one demo owner credential.');
    await tx.query('DELETE FROM "session" WHERE "userId" = $1', [id]);
  });
}

async function run() {
  const { DATABASE_URL, DEMO_OWNER_PASSWORD } = process.env;
  if (!DATABASE_URL || !DEMO_OWNER_PASSWORD)
    throw new RecoveryError('Set DATABASE_URL and DEMO_OWNER_PASSWORD before running recovery.');
  try {
    await connectDatabase(DATABASE_URL, { connectionTimeoutMillis: 15000 });
    await resetDemoOwner(DEMO_OWNER_PASSWORD);
    logger.info('Demo owner password updated and existing owner sessions revoked.');
  } finally {
    await disconnectDatabase();
  }
}

if (require.main === module) {
  void run().catch((error: unknown) => {
    logger.error(error instanceof RecoveryError ? error.message : 'Password recovery failed. Check database connectivity and schema.');
    process.exitCode = 1;
  });
}
