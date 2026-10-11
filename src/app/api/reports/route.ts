import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { currentUser } from "@/lib/server/current-user";
import { addReport, logActivity } from "@/lib/server/auth-store";

export const runtime = "nodejs";

interface Body {
  branchId?: unknown;
  branchName?: unknown;
  congestion?: unknown;
  parking?: unknown;
}

export async function POST(req: NextRequest) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const branchId = typeof body.branchId === "string" ? body.branchId : "";
  const branchName = typeof body.branchName === "string" ? body.branchName : "";
  const congestion = typeof body.congestion === "string" ? body.congestion : "";
  const parking = typeof body.parking === "string" ? body.parking : "";

  if (!branchId || !congestion) {
    return NextResponse.json(
      { success: false, error: "דיווח חסר נתונים" },
      { status: 400 },
    );
  }

  const user = await currentUser(req);
  await addReport({
    at: new Date().toISOString(),
    branchId,
    branchName,
    congestion,
    parking,
    email: user?.email,
  });
  await logActivity(
    "report",
    `דיווח עומס · ${branchName || branchId}`,
    user?.email,
  );

  return NextResponse.json({ success: true });
}
