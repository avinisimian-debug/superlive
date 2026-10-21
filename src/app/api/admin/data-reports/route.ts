import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { currentUser } from "@/lib/server/current-user";
import { QUARANTINED_BRANCHES, NATIONWIDE_COUNT } from "@/lib/branches";
import { getOpenDataReportSummary, resolveDataReports } from "@/lib/server/data-reports-store";

export const runtime = "nodejs";

async function requireAdmin(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return null;
}

/** Admin queue: open data-correction reports plus the quarantined branches. */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const reasons: Record<string, number> = {};
  for (const q of QUARANTINED_BRANCHES) reasons[q.reason] = (reasons[q.reason] ?? 0) + 1;

  return NextResponse.json({
    listed: NATIONWIDE_COUNT,
    quarantined: QUARANTINED_BRANCHES.length,
    quarantineReasons: reasons,
    reports: await getOpenDataReportSummary(),
  });
}

/** Marks a branch's open reports as handled. Body: { branchId } */
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as { branchId?: unknown };
  if (typeof body.branchId !== "string" || !body.branchId) {
    return NextResponse.json({ error: "branchId_required" }, { status: 400 });
  }
  await resolveDataReports(body.branchId);
  return NextResponse.json({ success: true });
}
