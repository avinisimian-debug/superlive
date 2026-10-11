import { createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
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

/** The full persisted account record (data/users.json). */
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

/**
 * File-backed persistence with an in-memory fallback. The files live under
 * `data/` as the task requires; if the filesystem is read-only (as on some
 * serverless hosts) the process keeps working from memory instead of failing.
 */
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

/** All accounts, including password material (server-side only). */
export async function getStoredUsers(): Promise<StoredUser[]> {
  return readJson<StoredUser[]>(USERS_FILE, []);
}

export async function getStoredUser(email: string): Promise<StoredUser | null> {
  const users = await getStoredUsers();
  return users.find((u) => u.email === email) ?? null;
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

/** The public account list returned to the admin dashboard. */
export async function getPublicUsers(): Promise<AuthUser[]> {
  const users = await getStoredUsers();
  return users.map(toAuthUser);
}

export function verifyPassword(user: StoredUser, password: string): boolean {
  if (!user.passwordHash || !user.salt) return false;
  const candidate = hashPassword(password, user.salt);
  // Length check guards timingSafeEqual-ish comparison of hex strings.
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
  const users = await getStoredUsers();
  const now = new Date().toISOString();
  const existing = users.find((u) => u.email === email);

  if (existing) {
    // Legacy accounts (e.g. created during the OTP era) have no password yet:
    // let this first password set claim the account instead of blocking it.
    if (existing.passwordHash && existing.salt) return null;
    if (!existing.id) existing.id = generateId();
    existing.salt = generateSalt();
    existing.passwordHash = hashPassword(input.password, existing.salt);
    existing.name = input.name.trim() || existing.name;
    if (roleForEmail(email) === "admin") existing.role = "admin";
    existing.lastLoginAt = now;
    await writeJson(USERS_FILE, users);
    return existing;
  }

  const user: StoredUser = {
    id: generateId(),
    name: input.name.trim(),
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
  const users = await getStoredUsers();
  const user = users.find((u) => u.email === normalizeEmail(email));
  if (!user) return;
  user.lastLoginAt = new Date().toISOString();
  await writeJson(USERS_FILE, users);
}

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