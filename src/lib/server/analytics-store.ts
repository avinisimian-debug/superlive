import { neon } from "@neondatabase/serverless";

const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

type SqlClient = ReturnType<typeof neon>;
let sqlClient: SqlClient | null = null;

function getSql(): SqlClient | null {
  if (!DB_URL) return null;
  if (!sqlClient) sqlClient = neon(DB_URL);
  return sqlClient;
}

let schemaPromise: Promise<void> | null = null;
async function ensureSchema(sql: SqlClient): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS zerem_analytics (
        key text primary key,
        count integer not null default 0,
        last_at text not null
      )`;
    })().catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}

const memoryCounters = new Map<string, { count: number; last_at: string }>();

export async function recordAnalyticsEvent(key: string): Promise<number> {
  const now = new Date().toISOString();
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = (await sql`INSERT INTO zerem_analytics (key, count, last_at)
      VALUES (${key}, 1, ${now})
      ON CONFLICT (key) DO UPDATE
      SET count = zerem_analytics.count + 1, last_at = ${now}
      RETURNING count`) as { count: number }[];
    return rows[0]?.count ?? 1;
  }
  const cur = memoryCounters.get(key) || { count: 0, last_at: now };
  cur.count += 1;
  cur.last_at = now;
  memoryCounters.set(key, cur);
  return cur.count;
}

export async function getAnalyticsCounts(): Promise<Record<string, number>> {
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = (await sql`SELECT key, count FROM zerem_analytics`) as { key: string; count: number }[];
    const result: Record<string, number> = {};
    for (const r of rows) {
      result[r.key] = Number(r.count) || 0;
    }
    return result;
  }
  const result: Record<string, number> = {};
  for (const [k, v] of memoryCounters.entries()) {
    result[k] = v.count;
  }
  return result;
}
