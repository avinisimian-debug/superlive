import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BRANCHES } from "@/lib/branches";
import { currentUser } from "@/lib/server/current-user";
import { checkRateLimit } from "@/lib/server/crowd-engine";
import { DATA_ISSUE_KINDS, saveDataReport, type DataIssueKind } from "@/lib/server/data-reports-store";

export const runtime = "nodejs";

const KINDS: ReadonlySet<string> = new Set(DATA_ISSUE_KINDS);
const MAX_NOTE = 500;

/** A shopper reports that a branch's location, hours or status is wrong. */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "גוף הבקשה אינו בפורמט JSON תקין" }, { status: 400 });
  }

  const branchId = typeof body.branchId === "string" ? body.branchId.trim() : "";
  const kind = typeof body.kind === "string" ? body.kind.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, MAX_NOTE) : "";

  const branch = BRANCHES.find((b) => b.id === branchId);
  if (!branch && !branchId.startsWith("custom-")) {
    return NextResponse.json({ success: false, error: "סניף לא נמצא במערכת" }, { status: 422 });
  }
  if (!KINDS.has(kind)) {
    return NextResponse.json({ success: false, error: "סוג דיווח לא תקין" }, { status: 422 });
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  if (!checkRateLimit(`data:${branchId}`, clientIp)) {
    return NextResponse.json(
      { success: false, error: "כבר קיבלנו ממך דיווח על הסניף הזה. תודה!" },
      { status: 429 },
    );
  }

  const user = await currentUser(req);
  const report = await saveDataReport({
    branchId,
    branchName: branch?.name ?? (typeof body.branchName === "string" ? body.branchName.slice(0, 120) : branchId),
    kind: kind as DataIssueKind,
    note,
    userEmail: user?.email,
    clientIp,
  });

  return NextResponse.json({ success: true, id: report.id });
}
