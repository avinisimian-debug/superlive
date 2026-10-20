import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  const start = Date.now();
  const sql = getDb();
  let dbStatus = "unconfigured";
  let latencyMs = 0;

  if (sql) {
    try {
      await sql`SELECT 1 as ping`;
      dbStatus = "connected";
      latencyMs = Date.now() - start;
    } catch (err: any) {
      dbStatus = "error";
      latencyMs = Date.now() - start;
    }
  }

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    database: {
      status: dbStatus,
      latencyMs,
    },
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
