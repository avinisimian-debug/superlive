import { createHash, randomUUID } from "node:crypto";
import { getDb } from "./db";

/** What a shopper says is wrong with a branch listing. */
export const DATA_ISSUE_KINDS = ["wrong-location", "wrong-hours", "closed", "other"] as const;
export type DataIssueKind = (typeof DATA_ISSUE_KINDS)[number];

export interface DataReport {
  id: string;
  branchId: string;
  branchName: string;
  kind: DataIssueKind;
  note: string;
  userEmail?: string;
  createdAt: string;
  status: "open" | "resolved";
}

export interface DataReportSummary {
  branchId: string;
  branchName: string;
  open: number;
  kinds: Record<DataIssueKind, number>;
  lastAt: string;
  notes: string[];
}

let schemaPromise: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const sql = getDb();
  if (!sql) return;
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS zerem_data_reports (
        id text PRIMARY KEY,
        branch_id text NOT NULL,
        branch_name text,
        kind text NOT NULL CHECK (kind IN ('wrong-location', 'wrong-hours', 'closed', 'other')),
        note text,
        user_email text,
        ip_hash text,
        status text NOT NULL DEFAULT 'open',
        created_at timestamp with time zone DEFAULT now()
      )`;
      await sql`CREATE INDEX IF NOT EXISTS idx_zerem_data_reports_branch
        ON zerem_data_reports(branch_id, created_at DESC)`;
    })().catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}

/** Per-instance fallback when no database is configured (local dev). */
const memory: DataReport[] = [];

function hashIp(ip: string): string {
  return createHash("sha256").update(`zerem-data:${ip}`).digest("hex").slice(0, 24);
}

export async function saveDataReport(input: {
  branchId: string;
  branchName: string;
  kind: DataIssueKind;
  note: string;
  userEmail?: string;
  clientIp: string;
}): Promise<DataReport> {
  const report: DataReport = {
    id: randomUUID(),
    branchId: input.branchId,
    branchName: input.branchName,
    kind: input.kind,
    note: input.note,
    userEmail: input.userEmail,
    createdAt: new Date().toISOString(),
    status: "open",
  };
  const sql = getDb();
  if (sql) {
    await ensureSchema();
    await sql`INSERT INTO zerem_data_reports
      (id, branch_id, branch_name, kind, note, user_email, ip_hash, status, created_at)
      VALUES (${report.id}, ${report.branchId}, ${report.branchName}, ${report.kind},
        ${report.note}, ${report.userEmail ?? null}, ${hashIp(input.clientIp)}, 'open', ${report.createdAt})`;
  } else {
    memory.unshift(report);
    memory.length = Math.min(memory.length, 500);
  }
  return report;
}

/** Open reports grouped by branch, most reported first, for the admin queue. */
export async function getOpenDataReportSummary(limit = 100): Promise<DataReportSummary[]> {
  let rows: DataReport[] = [];
  const sql = getDb();
  if (sql) {
    await ensureSchema();
    const result = (await sql`SELECT id, branch_id, branch_name, kind, note, user_email, status, created_at
      FROM zerem_data_reports WHERE status = 'open'
      ORDER BY created_at DESC LIMIT 2000`) as Record<string, unknown>[];
    rows = result.map((r) => ({
      id: String(r.id),
      branchId: String(r.branch_id),
      branchName: String(r.branch_name ?? ""),
      kind: r.kind as DataIssueKind,
      note: String(r.note ?? ""),
      userEmail: r.user_email ? String(r.user_email) : undefined,
      createdAt: new Date(String(r.created_at)).toISOString(),
      status: "open",
    }));
  } else {
    rows = memory.filter((r) => r.status === "open");
  }

  const byBranch = new Map<string, DataReportSummary>();
  for (const r of rows) {
    let s = byBranch.get(r.branchId);
    if (!s) {
      s = {
        branchId: r.branchId,
        branchName: r.branchName,
        open: 0,
        kinds: { "wrong-location": 0, "wrong-hours": 0, closed: 0, other: 0 },
        lastAt: r.createdAt,
        notes: [],
      };
      byBranch.set(r.branchId, s);
    }
    s.open += 1;
    s.kinds[r.kind] += 1;
    if (r.note && s.notes.length < 3) s.notes.push(r.note);
  }
  return [...byBranch.values()].sort((a, b) => b.open - a.open || b.lastAt.localeCompare(a.lastAt)).slice(0, limit);
}

/** Marks every open report for a branch as handled once the listing is fixed. */
export async function resolveDataReports(branchId: string): Promise<void> {
  const sql = getDb();
  if (sql) {
    await ensureSchema();
    await sql`UPDATE zerem_data_reports SET status = 'resolved' WHERE branch_id = ${branchId} AND status = 'open'`;
    return;
  }
  for (const r of memory) if (r.branchId === branchId) r.status = "resolved";
}
