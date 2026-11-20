import type { Sql } from '../db/pool';
import { newId } from '../db/rows';
import { nativeImport } from '../lib/nativeImport';
export async function hashSecret(password: string) {
  const crypto = await nativeImport<typeof import('better-auth/crypto')>('better-auth/crypto');
  return crypto.hashPassword(password);
}
export async function insertAuthUser(
  db: Sql,
  input: { id?: string; email: string; name: string; password?: string },
) {
  const id = input.id ?? newId();
  const email = input.email.toLowerCase();
  await db.query(
    `INSERT INTO "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, true, now(), now())`,
    [id, input.name, email],
  );
  if (input.password) {
    const password = await hashSecret(input.password);
    await db.query(
      `INSERT INTO "account" (
         "id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt"
       ) VALUES ($1, $2, 'credential', $2, $3, now(), now())`,
      [newId(), id, password],
    );
  }
  return id;
}
export async function authUserExists(db: Sql, id: string) {
  const result = await db.query(`SELECT "id" FROM "user" WHERE "id" = $1`, [id]);
  return result.rowCount > 0;
}
export async function disableAuthUser(db: Sql, id: string) {
  if (!(await authUserExists(db, id))) return;
  await db.query(`DELETE FROM "session" WHERE "userId" = $1`, [id]);
  const password = await hashSecret(`${newId()}${newId()}`);
  await db.query(
    `UPDATE "account" SET "password" = $2, "updatedAt" = now()
     WHERE "userId" = $1 AND "providerId" = 'credential'`,
    [id, password],
  );
}
export async function deleteAuthUser(db: Sql, id: string) {
  await db.query(`DELETE FROM "session" WHERE "userId" = $1`, [id]);
  await db.query(`DELETE FROM "account" WHERE "userId" = $1`, [id]);
  await db.query(`DELETE FROM "user" WHERE "id" = $1`, [id]);
}
