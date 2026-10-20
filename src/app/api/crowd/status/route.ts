import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDb, initDbSchema } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json(
      { success: false, error: "נדרש פרמטר ids עם רשימת סניפים מופרדת בפסיקים" },
      { status: 400 }
    );
  }

  const branchIds = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 100); // max 100 per request

  if (branchIds.length === 0) {
    return NextResponse.json({ success: true, statuses: {} });
  }

  await initDbSchema();
  const sql = getDb();

  if (!sql) {
    return NextResponse.json({ success: true, statuses: {} });
  }

  try {
    const rows = await sql`
      SELECT branch_id, congestion, parking, report_count, last_report_at, updated_at
      FROM zerem_branch_status
      WHERE branch_id = ANY(${branchIds})
    `;

    const statuses: Record<string, any> = {};
    for (const r of rows as any[]) {
      statuses[r.branch_id] = {
        congestion: r.congestion,
        parking: r.parking,
        reportCount: r.report_count,
        lastReportAt: r.last_report_at,
        updatedAt: r.updated_at,
        estimated: false,
      };
    }

    return NextResponse.json({ success: true, count: Object.keys(statuses).length, statuses });
  } catch (err: any) {
    console.error("[crowd/status] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const branchIds = Array.isArray(body.branchIds)
    ? body.branchIds.map((id: any) => String(id).trim()).filter(Boolean).slice(0, 150)
    : [];

  if (branchIds.length === 0) {
    return NextResponse.json({ success: true, statuses: {} });
  }

  await initDbSchema();
  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ success: true, statuses: {} });
  }

  try {
    const rows = await sql`
      SELECT branch_id, congestion, parking, report_count, last_report_at, updated_at
      FROM zerem_branch_status
      WHERE branch_id = ANY(${branchIds})
    `;

    const statuses: Record<string, any> = {};
    for (const r of rows as any[]) {
      statuses[r.branch_id] = {
        congestion: r.congestion,
        parking: r.parking,
        reportCount: r.report_count,
        lastReportAt: r.last_report_at,
        updatedAt: r.updated_at,
        estimated: false,
      };
    }

    return NextResponse.json({ success: true, count: Object.keys(statuses).length, statuses });
  } catch (err: any) {
    console.error("[crowd/status POST] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
