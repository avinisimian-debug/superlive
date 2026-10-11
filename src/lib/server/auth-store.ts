import { createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import type { ActivityEvent, ActivityType, AuthUser, UserRole } from "@/lib/types";

/** The hard-coded administrators of Zerem. */
export const ADMIN_EMAILS = ["aviya.nish@gmail.com", "avi.nisimian@gmail.com"];
/** Backwards-compatible primary admin address. */
export const ADMIN_EMAIL = ADMIN_EMAILS[0];

/** Session lifetime: one full year (task requirement). */
export const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000;
/** Session cookie name. */
export const SESSION_COOKIE = "zerem_session";

/** Resolves the role for an address: the two owner addresses are admins. */
export function roleForEmail(email: string): UserRole {
  return ADMIN_EMAILS.includes(normalizeEmail(email)) ? "admin" : "user";
}

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ACTIVITY_FILE = path.join(DATA_DIR, "activity.json");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");

/** The full persisted account record. */
export interface StoredUser {
  id: string;
  name?: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt: string;
  role: UserRole;
}

export interface ReportEvent {
  at: string;
  branchId: string;
  branchName: string;
  congestion: string;
  parking: string;
  email?: string;
}

export function normalizeEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function generateId(): string {
  return randomBytes(12).toString("hex");
}

export function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

/** SHA256(salt + password) — salted so identical passwords differ per account. */
export function hashPassword(password: string, salt: string): string {
  return createHash("sha256").update(`${salt}${password}`).digest("hex");
}

/* ------------------------------------------------------------------ *
 * Postgres (Neon) storage — the permanent, cross-instance store.
 * Falls back to the file/memory store when no DATABASE_URL is set.
 * ------------------------------------------------------------------ */

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
      await sql`CREATE TABLE IF NOT EXISTS zerem_users (
        id text primary key,
        name text,
        email text unique,
        password_hash text,
        salt text,
        created_at text,
        last_login_at text,
        role text
      )`;
    })().catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}

interface UserRow {
  id: string | null;
  name: string | null;
  email: string | null;
  password_hash: string | null;
  salt: string | null;
  created_at: string | null;
  last_login_at: string | null;
  role: string | null;
}

function rowToStored(row: UserRow): StoredUser {
  const email = normalizeEmail(row.email);
  return {
    id: row.id ?? "",
    name: row.name ?? undefined,
    email,
    passwordHash: row.password_hash ?? "",
    salt: row.salt ?? "",
    createdAt: row.created_at ?? "",
    lastLoginAt: row.last_login_at ?? "",
    // The owner accounts are always admins, whatever the row says.
    role: roleForEmail(email) === "admin" ? "admin" : row.role === "admin" ? "admin" : "user",
  };
}

/** Public account list — password hash and salt stripped. */
export function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    role: user.role,
  };
}

/* ------------------------------------------------------------------ *
 * File/memory fallback store (used only when DATABASE_URL is absent).
 * ------------------------------------------------------------------ */

const memory = new Map<string, unknown>();

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    const cached = memory.get(file);
    return cached === undefined ? fallback : (cached as T);
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  memory.set(file, value);
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
  } catch {
    /* read-only FS — memory fallback already updated */
  }
}

/* ------------------------------------------------------------------ *
 * User API
 * ------------------------------------------------------------------ */

/** All accounts, including password material (server-side only). */
export async function getStoredUsers(): Promise<StoredUser[]> {
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = (await sql`SELECT id, name, email, password_hash, salt, created_at, last_login_at, role
      FROM zerem_users ORDER BY last_login_at DESC`) as UserRow[];
    return rows.map(rowToStored);
  }
  return readJson<StoredUser[]>(USERS_FILE, []);
}

export async function getStoredUser(email: string): Promise<StoredUser | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = (await sql`SELECT id, name, email, password_hash, salt, created_at, last_login_at, role
      FROM zerem_users WHERE email = ${normalized} LIMIT 1`) as UserRow[];
    return rows.length ? rowToStored(rows[0]) : null;
  }
  const users = await readJson<StoredUser[]>(USERS_FILE, []);
  return users.find((u) => u.email === normalized) ?? null;
}

/** The public account list returned to the admin dashboard. */
export async function getPublicUsers(): Promise<AuthUser[]> {
  const users = await getStoredUsers();
  return users.map(toAuthUser);
}

export function verifyPassword(user: StoredUser, password: string): boolean {
  if (!user.passwordHash || !user.salt) return false;
  const candidate = hashPassword(password, user.salt);
  if (candidate.length !== user.passwordHash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i += 1) {
    diff |= candidate.charCodeAt(i) ^ user.passwordHash.charCodeAt(i);
  }
  return diff === 0;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Creates a fresh account. Returns the stored record, or null when the email
 * already has a password set on file.
 */
export async function createUser(
  input: CreateUserInput,
): Promise<StoredUser | null> {
  const email = normalizeEmail(input.email);
  const now = new Date().toISOString();
  const name = input.name.trim();

  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const existing = await getStoredUser(email);
    if (existing) {
      // Legacy accounts with no password yet may be claimed by the first set.
      if (existing.passwordHash && existing.salt) return null;
      const salt = generateSalt();
      const passwordHash = hashPassword(input.password, salt);
      const id = existing.id || generateId();
      const role = roleForEmail(email) === "admin" ? "admin" : existing.role;
      const rows = (await sql`UPDATE zerem_users
        SET id = ${id}, name = ${name || existing.name || null}, password_hash = ${passwordHash},
            salt = ${salt}, role = ${role}, last_login_at = ${now}
        WHERE email = ${email}
        RETURNING id, name, email, password_hash, salt, created_at, last_login_at, role`) as UserRow[];
      return rows.length ? rowToStored(rows[0]) : null;
    }
    const salt = generateSalt();
    const user: StoredUser = {
      id: generateId(),
      name,
      email,
      salt,
      passwordHash: hashPassword(input.password, salt),
      createdAt: now,
      lastLoginAt: now,
      role: roleForEmail(email),
    };
    const rows = (await sql`INSERT INTO zerem_users
      (id, name, email, password_hash, salt, created_at, last_login_at, role)
      VALUES (${user.id}, ${user.name ?? null}, ${email}, ${user.passwordHash}, ${user.salt},
              ${user.createdAt}, ${user.lastLoginAt}, ${user.role})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email, password_hash, salt, created_at, last_login_at, role`) as UserRow[];
    return rows.length ? rowToStored(rows[0]) : null;
  }

  // File-store fallback.
  const users = await readJson<StoredUser[]>(USERS_FILE, []);
  const existing = users.find((u) => u.email === email);
  if (existing) {
    if (existing.passwordHash && existing.salt) return null;
    if (!existing.id) existing.id = generateId();
    existing.salt = generateSalt();
    existing.passwordHash = hashPassword(input.password, existing.salt);
    existing.name = name || existing.name;
    if (roleForEmail(email) === "admin") existing.role = "admin";
    existing.lastLoginAt = now;
    await writeJson(USERS_FILE, users);
    return existing;
  }
  const user: StoredUser = {
    id: generateId(),
    name,
    email,
    salt: generateSalt(),
    passwordHash: "",
    createdAt: now,
    lastLoginAt: now,
    role: roleForEmail(email),
  };
  user.passwordHash = hashPassword(input.password, user.salt);
  users.push(user);
  await writeJson(USERS_FILE, users);
  return user;
}

/** Refreshes the last-login timestamp for an account. */
export async function touchLastLogin(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const now = new Date().toISOString();
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    await sql`UPDATE zerem_users SET last_login_at = ${now} WHERE email = ${normalized}`;
    return;
  }
  const users = await readJson<StoredUser[]>(USERS_FILE, []);
  const user = users.find((u) => u.email === normalized);
  if (!user) return;
  user.lastLoginAt = now;
  await writeJson(USERS_FILE, users);
}

/* ------------------------------------------------------------------ *
 * Activity + reports (file-backed, unchanged)
 * ------------------------------------------------------------------ */

export async function getActivity(limit = 50): Promise<ActivityEvent[]> {
  const all = await readJson<ActivityEvent[]>(ACTIVITY_FILE, []);
  return all.slice(-limit).reverse();
}

export async function logActivity(
  type: ActivityType,
  text: string,
  email?: string,
): Promise<void> {
  const all = await readJson<ActivityEvent[]>(ACTIVITY_FILE, []);
  all.push({ at: new Date().toISOString(), type, text, email });
  await writeJson(ACTIVITY_FILE, all.slice(-500));
}

export async function getReports(): Promise<ReportEvent[]> {
  return readJson<ReportEvent[]>(REPORTS_FILE, []);
}

export async function addReport(event: ReportEvent): Promise<void> {
  const all = await readJson<ReportEvent[]>(REPORTS_FILE, []);
  all.push(event);
  await writeJson(REPORTS_FILE, all.slice(-2000));
}