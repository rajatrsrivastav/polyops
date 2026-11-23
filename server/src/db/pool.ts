import { Pool, type PoolClient, type QueryResult } from 'pg';
export type SqlValue = string | number | boolean | Date | null;
export type SqlRow = Record<string, unknown>;
export type SqlResult = { rows: SqlRow[]; rowCount: number; command: string };
export interface Sql {
  query(text: string, params?: readonly SqlValue[]): Promise<SqlResult>;
}
export interface SqlPool {
  connect(): Promise<SqlClient>;
  end(): Promise<void>;
  options: object;
}
export interface SqlClient extends Sql {
  release(): void;
}
const knownCommands = new Set(['UPDATE', 'DELETE', 'INSERT', 'SELECT', 'MERGE', 'COMMIT', 'ROLLBACK']);
export function sqlCommand(value: string | undefined): string {
  if (value && knownCommands.has(value)) return value;
  return 'SELECT';
}
class PgClient implements SqlClient {
  constructor(private readonly client: PoolClient) {}
  async query(text: string, params: readonly SqlValue[] = []): Promise<SqlResult> {
    const result: QueryResult<SqlRow> = await this.client.query(text, [...params]);
    return {
      rows: result.rows,
      rowCount: result.rowCount ?? 0,
      command: sqlCommand(result.command),
    };
  }
  release() {
    this.client.release();
  }
}
export class PgPool implements SqlPool {
  readonly options: object;
  constructor(private readonly pool: Pool) {
    this.options = pool.options;
  }
  async connect(): Promise<SqlClient> {
    return new PgClient(await this.pool.connect());
  }
  end() {
    return this.pool.end();
  }
  raw() {
    return this.pool;
  }
}
let pool: SqlPool | null = null;
let open = false;
export function usePool(next: SqlPool) {
  pool = next;
  open = true;
}
export function databaseReadyState() {
  return open && pool ? 1 : 0;
}
export function markDatabaseOpen() {
  if (!pool) throw new Error('Database is not connected');
  open = true;
}
export function markDatabaseClosed() {
  open = false;
}
export function getPool(): SqlPool {
  if (!pool || !open) throw new Error('Database disconnected');
  return pool;
}
export async function query(text: string, params: readonly SqlValue[] = []): Promise<SqlResult> {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
export async function transaction<T>(fn: (tx: Sql) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function pingDatabase() {
  await query('SELECT 1');
}
export async function connectDatabase(
  connectionString: string,
  options: { connectionTimeoutMillis?: number } = {},
) {
  const created = new Pool({ connectionString, max: 10, ...options });
  usePool(new PgPool(created));
  await pingDatabase();
}
export async function disconnectDatabase() {
  const current = pool;
  markDatabaseClosed();
  pool = null;
  if (current) await current.end();
}
