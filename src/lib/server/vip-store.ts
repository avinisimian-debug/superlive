import { promises as fs } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

export interface VipSubscription {
  id: string;
  email: string;
  name?: string;
  method: string;
  authCode: string;
  activatedAt: string;
  expiresAt: string;
  expiryNotified: boolean;
  status: "active" | "expired";
}

const DATA_DIR = path.join(process.cwd(), "data");
const VIP_FILE = path.join(DATA_DIR, "vip_subscriptions.json");

const DB_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
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
      await sql`CREATE TABLE IF NOT EXISTS zerem_vip_subscriptions (
        id text primary key,
        email text,
        name text,
        method text,
        auth_code text,
        activated_at text,
        expires_at text,
        expiry_notified boolean default false,
        status text default 'active'
      )`;
    })().catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}

async function readVipJson(): Promise<VipSubscription[]> {
  try {
    const raw = await fs.readFile(VIP_FILE, "utf-8");
    return JSON.parse(raw) as VipSubscription[];
  } catch {
    return [];
  }
}

async function writeVipJson(list: VipSubscription[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(VIP_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("[vip-store] writeVipJson failed:", err);
  }
}

export async function saveVipSubscription(sub: Omit<VipSubscription, "id" | "expiryNotified" | "status">): Promise<VipSubscription> {
  const record: VipSubscription = {
    ...sub,
    id: `vip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    expiryNotified: false,
    status: "active",
  };

  const sql = getSql();
  if (sql) {
    try {
      await ensureSchema(sql);
      await sql`INSERT INTO zerem_vip_subscriptions (
        id, email, name, method, auth_code, activated_at, expires_at, expiry_notified, status
      ) VALUES (
        ${record.id}, ${record.email}, ${record.name || null}, ${record.method},
        ${record.authCode}, ${record.activatedAt}, ${record.expiresAt},
        ${record.expiryNotified}, ${record.status}
      )`;
      return record;
    } catch (err) {
      console.warn("[vip-store] Neon insert failed, using JSON fallback:", err);
    }
  }

  const existing = await readVipJson();
  const filtered = existing.filter((s) => s.email.toLowerCase() !== record.email.toLowerCase());
  filtered.push(record);
  await writeVipJson(filtered);
  return record;
}

export async function getExpiringVipSubscriptions(): Promise<VipSubscription[]> {
  const now = new Date().toISOString();
  // Subscriptions expiring in less than 48 hours or already expired, not yet notified
  const in48Hours = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const sql = getSql();
  if (sql) {
    try {
      await ensureSchema(sql);
      const rows = await sql`
        SELECT id, email, name, method, auth_code, activated_at, expires_at, expiry_notified, status
        FROM zerem_vip_subscriptions
        WHERE expiry_notified = false AND expires_at <= ${in48Hours}
      `;
      return (rows as any[]).map((r: any) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        method: r.method,
        authCode: r.auth_code,
        activatedAt: r.activated_at,
        expiresAt: r.expires_at,
        expiryNotified: r.expiry_notified,
        status: r.status,
      }));
    } catch (err) {
      console.warn("[vip-store] Neon getExpiring failed, using JSON:", err);
    }
  }

  const list = await readVipJson();
  return list.filter((s) => !s.expiryNotified && s.expiresAt <= in48Hours);
}

export async function markVipExpiryNotified(id: string): Promise<void> {
  const sql = getSql();
  if (sql) {
    try {
      await ensureSchema(sql);
      await sql`UPDATE zerem_vip_subscriptions SET expiry_notified = true WHERE id = ${id}`;
      return;
    } catch (err) {
      console.warn("[vip-store] Neon markNotified failed:", err);
    }
  }

  const list = await readVipJson();
  const updated = list.map((s) => (s.id === id ? { ...s, expiryNotified: true } : s));
  await writeVipJson(updated);
}
