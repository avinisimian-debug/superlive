import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { currentUser } from "@/lib/server/current-user";
import { logActivity } from "@/lib/server/auth-store";
import {
  validateReportInput,
  checkRateLimit,
  submitReportToDb,
  getBranchReportsFromDb,
} from "@/lib/server/crowd-engine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "גוף הבקשה אינו בפורמט JSON תקין" },
      { status: 400 }
    );
  }

  // 1. Strict Validation
  const validation = validateReportInput(body);
  if (!validation.valid || !validation.clean) {
    return NextResponse.json(
      { success: false, error: validation.error || "נתוני דיווח לא תקינים" },
      { status: 422 }
    );
  }

  const { branchId, branchName, congestion, parking } = validation.clean;

  // 2. Client IP & Rate Limiting
  const forwarded = req.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

  if (!checkRateLimit(branchId, clientIp)) {
    return NextResponse.json(
      {
        success: false,
        error: "דיווחת על סניף זה לאחרונה. נא להמתין כחצי דקה לפני דיווח נוסף.",
      },
      { status: 429 }
    );
  }

  // 3. Current User context
  const user = await currentUser(req);

  // 4. Persistence to Postgres + Live State recalculation
  const result = await submitReportToDb({
    branchId,
    branchName,
    congestion,
    parking,
    userEmail: user?.email,
    clientIp,
  });

  // 5. Activity log
  void logActivity(
    "report",
    `דיווח עומס: ${congestion} · ${branchName || branchId}`,
    user?.email
  );

  return NextResponse.json({
    success: true,
    reportId: result.reportId,
    status: result.status,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 50) : 20;

  if (!branchId) {
    return NextResponse.json(
      { success: false, error: "נדרש פרמטר branchId" },
      { status: 400 }
    );
  }

  const reports = await getBranchReportsFromDb(branchId, limit);

  return NextResponse.json({
    success: true,
    branchId,
    count: reports.length,
    reports,
  });
}
