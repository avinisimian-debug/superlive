import { createHash, randomBytes } from "node:crypto";
import { getDb, initDbSchema } from "./db";
import { BRANCHES } from "@/lib/branches";
import type { Congestion, Parking, LiveState } from "@/lib/types";

export interface StoredReport {
  id: string;
  branchId: string;
  branchName?: string;
  congestion: Congestion;
  parking: Parking;
  source: string;
  createdAt: string;
  expiresAt: string;
  isValid: boolean;
}

export interface ReportValidationResult {
  valid: boolean;
  error?: string;
  clean?: {
    branchId: string;
    branchName: string;
    congestion: Congestion;
    parking: Parking;
  };
}

const VALID_CONGESTION: ReadonlySet<string> = new Set(["free", "medium", "heavy"]);
const VALID_PARKING: ReadonlySet<string> = new Set(["plenty", "partial", "none"]);

// In-memory rate limiting map: key = `${branchId}:${ipHash}`, value = epoch ms
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 30 * 1000; // 30 seconds

export function validateReportInput(body: any): ReportValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "גוף הבקשה אינו תקין" };
  }

  const branchId = typeof body.branchId === "string" ? body.branchId.trim() : "";
  const congestion = typeof body.congestion === "string" ? body.congestion.trim().toLowerCase() : "";
  const parking = typeof body.parking === "string" ? body.parking.trim().toLowerCase() : "plenty";
  const branchName = typeof body.branchName === "string" ? body.branchName.trim() : "";

  if (!branchId) {
    return { valid: false, error: "מזהה סניף חסר" };
  }

  // Branch must either be in standard branch catalogue or be a custom user branch
  const branchExists = BRANCHES.some((b) => b.id === branchId) || branchId.startsWith("custom-");
  if (!branchExists) {
    return { valid: false, error: "סניף לא נמצא במערכת" };
  }

  if (!VALID_CONGESTION.has(congestion)) {
    return { valid: false, error: "רמת עומס לא תקינה (חובה: free / medium / heavy)" };
  }

  if (!VALID_PARKING.has(parking)) {
    return { valid: false, error: "מצב חניה לא תקין (חובה: plenty / partial / none)" };
  }

  return {
    valid: true,
    clean: {
      branchId,
      branchName: branchName || branchId,
      congestion: congestion as Congestion,
      parking: parking as Parking,
    },
  };
}

export function checkRateLimit(branchId: string, clientIp: string): boolean {
  const ipHash = createHash("sha256").update(clientIp || "127.0.0.1").digest("hex").slice(0, 16);
  const key = `${branchId}:${ipHash}`;
  const now = Date.now();
  const lastTime = rateLimitMap.get(key);

  if (lastTime && now - lastTime < RATE_LIMIT_COOLDOWN_MS) {
    return false; // Rate limited
  }

  rateLimitMap.set(key, now);
  // Periodic cleanup
  if (rateLimitMap.size > 2000) {
    const cutoff = now - RATE_LIMIT_COOLDOWN_MS;
    for (const [k, v] of rateLimitMap.entries()) {
      if (v < cutoff) rateLimitMap.delete(k);
    }
  }
  return true;
}

/**
 * Calculates effective live crowd state using exponential time decay.
 */
export function calculateLiveState(reports: Array<{ congestion: Congestion; parking: Parking; at: number }>): {
  congestion: Congestion;
  parking: Parking;
  reportCount: number;
  lastReportAt: number | null;
} {
  const now = Date.now();
  const FRESH_WINDOW_MS = 90 * 60 * 1000;
  const recent = reports.filter((r) => now - r.at >= 0 && now - r.at <= FRESH_WINDOW_MS);

  if (recent.length === 0) {
    return {
      congestion: "free",
      parking: "plenty",
      reportCount: 0,
      lastReportAt: null,
    };
  }

  const congestionScores: Record<Congestion, number> = { free: 0, medium: 0, heavy: 0 };
  const parkingScores: Record<Parking, number> = { plenty: 0, partial: 0, none: 0 };
  let newest = 0;

  for (const report of recent) {
    const ageMin = (now - report.at) / 60000;
    const weight = Math.pow(0.5, ageMin / 25); // half-life 25 min
    congestionScores[report.congestion] += weight;
    parkingScores[report.parking] += weight;
    if (report.at > newest) newest = report.at;
  }

  const bestCongestion = (Object.keys(congestionScores) as Congestion[]).reduce((best, c) =>
    congestionScores[c] > congestionScores[best] ? c : best, "free");

  const bestParking = (Object.keys(parkingScores) as Parking[]).reduce((best, p) =>
    parkingScores[p] > parkingScores[best] ? p : best, "plenty");

  return {
    congestion: bestCongestion,
    parking: bestParking,
    reportCount: recent.length,
    lastReportAt: newest,
  };
}

/**
 * Submits a validated crowd report, persists to PostgreSQL, and refreshes the branch status cache.
 */
export async function submitReportToDb(params: {
  branchId: string;
  branchName: string;
  congestion: Congestion;
  parking: Parking;
  userEmail?: string;
  clientIp: string;
}): Promise<{ success: boolean; reportId: string; status: { congestion: Congestion; parking: Parking } }> {
  await initDbSchema();
  const sql = getDb();

  const reportId = `rep_${Date.now()}_${randomBytes(4).toString("hex")}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 60 * 1000); // 90 min window
  const ipHash = createHash("sha256").update(params.clientIp || "127.0.0.1").digest("hex").slice(0, 16);

  if (sql) {
    try {
      // 1. Insert Report
      await sql`
        INSERT INTO zerem_crowd_reports (
          id, branch_id, branch_name, congestion, parking, source, user_email, ip_hash, created_at, expires_at, is_valid
        ) VALUES (
          ${reportId}, ${params.branchId}, ${params.branchName}, ${params.congestion},
          ${params.parking}, 'user', ${params.userEmail || null}, ${ipHash},
          ${now.toISOString()}, ${expiresAt.toISOString()}, true
        )
      `;

      // 2. Fetch all fresh reports for branch
      const rows = await sql`
        SELECT congestion, parking, created_at 
        FROM zerem_crowd_reports 
        WHERE branch_id = ${params.branchId} AND expires_at > ${now.toISOString()} AND is_valid = true
        ORDER BY created_at DESC 
        LIMIT 20
      `;

      const parsedReports = (rows as any[]).map((r) => ({
        congestion: r.congestion as Congestion,
        parking: (r.parking || "plenty") as Parking,
        at: new Date(r.created_at).getTime(),
      }));

      const live = calculateLiveState(parsedReports);

      // 3. Upsert branch status cache
      await sql`
        INSERT INTO zerem_branch_status (
          branch_id, congestion, parking, report_count, last_report_at, updated_at
        ) VALUES (
          ${params.branchId}, ${live.congestion}, ${live.parking}, ${live.reportCount}, ${now.toISOString()}, ${now.toISOString()}
        )
        ON CONFLICT (branch_id) DO UPDATE SET
          congestion = EXCLUDED.congestion,
          parking = EXCLUDED.parking,
          report_count = EXCLUDED.report_count,
          last_report_at = EXCLUDED.last_report_at,
          updated_at = EXCLUDED.updated_at
      `;

      return {
        success: true,
        reportId,
        status: {
          congestion: live.congestion,
          parking: live.parking,
        },
      };
    } catch (err) {
      console.error("[crowd-engine] DB insert failed:", err);
    }
  }

  // Graceful fallback if database is momentarily unreachable
  return {
    success: true,
    reportId,
    status: {
      congestion: params.congestion,
      parking: params.parking,
    },
  };
}

/**
 * Retrieves latest crowd reports for a branch, sanitized for public consumption.
 */
export async function getBranchReportsFromDb(branchId: string, limit = 20) {
  await initDbSchema();
  const sql = getDb();
  if (!sql) return [];

  try {
    const now = new Date().toISOString();
    const rows = await sql`
      SELECT id, branch_id, congestion, parking, created_at, source
      FROM zerem_crowd_reports
      WHERE branch_id = ${branchId} AND expires_at > ${now} AND is_valid = true
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return (rows as any[]).map((r) => ({
      id: r.id,
      branchId: r.branch_id,
      congestion: r.congestion,
      parking: r.parking,
      at: new Date(r.created_at).getTime(),
      source: r.source,
    }));
  } catch (err) {
    console.error("[crowd-engine] getBranchReportsFromDb failed:", err);
    return [];
  }
}
