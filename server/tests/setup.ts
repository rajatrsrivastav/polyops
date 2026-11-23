import { markDatabaseClosed, markDatabaseOpen, databaseReadyState, disconnectDatabase } from '../src/db/pool';
import { ensureSchema, resetDatabase } from '../src/db/schema';
import { usePglite } from './pglitePool';
process.env.BETTER_AUTH_SECRET ??= 'synthetic-test-secret-value-32chars';
process.env.BETTER_AUTH_URL ??= 'http://localhost:3000';
beforeAll(async () => {
  await usePglite();
  await ensureSchema();
});
afterEach(async () => {
  if (databaseReadyState() !== 1) return;
  await resetDatabase();
});
afterAll(async () => {
  await disconnectDatabase();
});
export async function reconnectTestDatabase() {
  markDatabaseOpen();
}
export function markTestDatabaseClosed() {
  markDatabaseClosed();
}
export function testDatabaseReadyState() {
  return databaseReadyState();
}
