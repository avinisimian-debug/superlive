import { randomBytes, randomInt } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ActivityEvent, ActivityType, AuthUser, UserRole } from "@/lib/types";

/** The single hard-coded administrator of Zerem. */
export const ADMIN_EMAIL = "avi.nisimian@gmail.com";

/** OTP lifetime (task requirement: 10 minutes). */
export const OTP_TTL_MS = 10 * 60 * 1000;
/** Session lifetime. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Session cookie name. */
export const SESSION_COOKIE = "zerem_session";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const OTPS_FILE = path.join(DATA_DIR, "otps.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const ACTIVITY_FILE = path.join(DATA_DIR, "activity.json");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");

export interface OtpRecord {
  email: string;
  code: string;
  createdAt: number;
  expiresAt: number;
}

export interface SessionRecord {
  token: string;
  email: string;
  createdAt: number;
  expiresAt: number;
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

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function generateToken(): string {
  return randomBytes(24).toString("hex");
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

export async function getUsers(): Promise<AuthUser[]> {
  return readJson<AuthUser[]>(USERS_FILE, []);
}

export async function getUser(email: string): Promise<AuthUser | null> {
  const users = await getUsers();
  return users.find((u) => u.email === email) ?? null;
}

export async function upsertUser(
  email: string,
  role: UserRole,
  now: string,
): Promise<AuthUser> {
  const users = await getUsers();
  const existing = users.find((u) => u.email === email);
  if (existing) {
    existing.lastLoginAt = now;
    // The admin role is guaranteed for the owner address.
    if (email === ADMIN_EMAIL) existing.role = "admin";
    await writeJson(USERS_FILE, users);
    return existing;
  }
  const user: AuthUser = {
    email,
    createdAt: now,
    lastLoginAt: now,
    role: email === ADMIN_EMAIL ? "admin" : role,
  };
  users.push(user);
  await writeJson(USERS_FILE, users);
  return user;
}

export async function saveOtp(record: OtpRecord): Promise<void> {
  const otps = await readJson<Record<string, OtpRecord>>(OTPS_FILE, {});
  otps[record.email] = record;
  await writeJson(OTPS_FILE, otps);
}

export async function getOtp(email: string): Promise<OtpRecord | null> {
  const otps = await readJson<Record<string, OtpRecord>>(OTPS_FILE, {});
  return otps[email] ?? null;
}

export async function deleteOtp(email: string): Promise<void> {
  const otps = await readJson<Record<string, OtpRecord>>(OTPS_FILE, {});
  delete otps[email];
  await writeJson(OTPS_FILE, otps);
}

export async function createSession(email: string): Promise<SessionRecord> {
  const now = Date.now();
  const session: SessionRecord = {
    token: generateToken(),
    email,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  const sessions = await readJson<Record<string, SessionRecord>>(
    SESSIONS_FILE,
    {},
  );
  sessions[session.token] = session;
  await writeJson(SESSIONS_FILE, sessions);
  return session;
}

export async function getSession(
  token: string | undefined,
): Promise<SessionRecord | null> {
  if (!token) return null;
  const sessions = await readJson<Record<string, SessionRecord>>(
    SESSIONS_FILE,
    {},
  );
  const session = sessions[token];
  if (!session) return null;
  if (session.expiresAt < Date.now()) return null;
  return session;
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;
  const sessions = await readJson<Record<string, SessionRecord>>(
    SESSIONS_FILE,
    {},
  );
  if (sessions[token]) {
    delete sessions[token];
    await writeJson(SESSIONS_FILE, sessions);
  }
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
