import { neon } from "@neondatabase/serverless";

const DB_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";

type SqlClient = ReturnType<typeof neon>;

let client: SqlClient | null = null;

export function getDb(): SqlClient | null {
  if (!DB_URL) return null;
  if (!client) {
    client = neon(DB_URL);
  }
  return client;
}

let initPromise: Promise<void> | null = null;

/**
 * Initializes and validates database schema with indexes and constraints.
 * Safe and idempotent.
 */
export async function initDbSchema(): Promise<void> {
  const sql = getDb();
  if (!sql) return;

  if (!initPromise) {
    initPromise = (async () => {
      // 1. Chains Table
      await sql`CREATE TABLE IF NOT EXISTS zerem_chains (
        id text PRIMARY KEY,
        name text UNIQUE NOT NULL,
        logo_url text,
        active boolean DEFAULT true,
        created_at timestamp with time zone DEFAULT now()
      )`;

      // 2. Crowd Reports Table
      await sql`CREATE TABLE IF NOT EXISTS zerem_crowd_reports (
        id text PRIMARY KEY,
        branch_id text NOT NULL,
        branch_name text,
        congestion text NOT NULL CHECK (congestion IN ('free', 'medium', 'heavy')),
        parking text CHECK (parking IN ('plenty', 'partial', 'none')),
        source text DEFAULT 'user',
        user_email text,
        ip_hash text,
        created_at timestamp with time zone DEFAULT now(),
        expires_at timestamp with time zone NOT NULL,
        is_valid boolean DEFAULT true
      )`;

      // Indexes for rapid report lookup & pruning
      await sql`CREATE INDEX IF NOT EXISTS idx_zerem_reports_branch_created 
        ON zerem_crowd_reports(branch_id, created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_zerem_reports_expires 
        ON zerem_crowd_reports(expires_at)`;

      // 3. Branch Status Cache Table
      await sql`CREATE TABLE IF NOT EXISTS zerem_branch_status (
        branch_id text PRIMARY KEY,
        congestion text NOT NULL CHECK (congestion IN ('free', 'medium', 'heavy')),
        parking text NOT NULL CHECK (parking IN ('plenty', 'partial', 'none')),
        report_count integer DEFAULT 0,
        last_report_at timestamp with time zone,
        updated_at timestamp with time zone DEFAULT now()
      )`;

      // 4. Crowd Pings Table (Passive GPS location signals)
      await sql`CREATE TABLE IF NOT EXISTS zerem_crowd_pings (
        id text PRIMARY KEY,
        branch_id text NOT NULL,
        device_hash text NOT NULL,
        lat double precision,
        lng double precision,
        pinged_at timestamp with time zone DEFAULT now()
      )`;

      await sql`CREATE INDEX IF NOT EXISTS idx_zerem_pings_branch_time 
        ON zerem_crowd_pings(branch_id, pinged_at DESC)`;

      // 5. VIP Subscriptions Table
      await sql`CREATE TABLE IF NOT EXISTS zerem_vip_subscriptions (
        id text PRIMARY KEY,
        email text NOT NULL,
        name text,
        method text NOT NULL,
        auth_code text NOT NULL,
        activated_at timestamp with time zone DEFAULT now(),
        expires_at timestamp with time zone NOT NULL,
        expiry_notified boolean DEFAULT false,
        status text DEFAULT 'active'
      )`;

      await sql`CREATE INDEX IF NOT EXISTS idx_zerem_vip_email 
        ON zerem_vip_subscriptions(email)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_zerem_vip_expires 
        ON zerem_vip_subscriptions(expires_at)`;

      // 6. Users Table
      await sql`CREATE TABLE IF NOT EXISTS zerem_users (
        id text PRIMARY KEY,
        name text,
        email text UNIQUE NOT NULL,
        password_hash text NOT NULL,
        salt text NOT NULL,
        created_at text NOT NULL,
        last_login_at text NOT NULL,
        role text DEFAULT 'user'
      )`;
    })().catch((err) => {
      initPromise = null;
      console.error("[db] Schema initialization failed:", err);
      throw err;
    });
  }

  return initPromise;
}
