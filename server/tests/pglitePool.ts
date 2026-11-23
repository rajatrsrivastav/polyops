import { PGlite } from '@electric-sql/pglite';
import { sqlCommand, usePool, type SqlClient, type SqlPool, type SqlResult, type SqlValue } from '../src/db/pool';
class PgliteClient implements SqlClient {
  private readonly engine: PGlite;
  private readonly unlock: () => void;
  constructor(engine: PGlite, unlock: () => void) {
    this.engine = engine;
    this.unlock = unlock;
  }
  async query(text: string, params: readonly SqlValue[] = []): Promise<SqlResult> {
    const result = await this.engine.query<Record<string, unknown>>(text, [...params]);
    return {
      rows: result.rows,
      rowCount: result.affectedRows ?? result.rows.length,
      command: sqlCommand(result.command),
    };
  }
  release() {
    this.unlock();
  }
}
export class PglitePool implements SqlPool {
  readonly options: object = {};
  private tail: Promise<void> = Promise.resolve();
  private readonly engine: PGlite;
  constructor(engine: PGlite) {
    this.engine = engine;
  }
  connect(): Promise<SqlClient> {
    const engine = this.engine;
    let unlock: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    const previous = this.tail;
    this.tail = gate;
    return previous.then(() => new PgliteClient(engine, unlock));
  }
  async end() {
    await this.engine.close();
  }
}
export async function usePglite() {
  const engine = new PGlite();
  const pool = new PglitePool(engine);
  usePool(pool);
  return pool;
}
