import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { recordPing } from "@/lib/server/crowd-store";

export const runtime = "nodejs";

interface Body {
  branchId?: unknown;
  lat?: unknown;
  lng?: unknown;
}

export async function POST(req: NextRequest) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const branchId = typeof body.branchId === "string" ? body.branchId.trim() : "";
  const lat = typeof body.lat === "number" ? body.lat : Number(body.lat);
  const lng = typeof body.lng === "number" ? body.lng : Number(body.lng);

  if (!branchId || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { success: false, error: "נתוני פינג חסרים" },
      { status: 400 },
    );
  }

  // Identify the active device without any client-side storage: same IP +
  // user-agent refreshes one entry instead of stacking new ones.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  const deviceKey = createHash("sha1")
    .update(`${ip}|${ua}`)
    .digest("hex")
    .slice(0, 16);

  const snapshot = await recordPing(branchId, deviceKey, lat, lng);

  return NextResponse.json({
    success: true,
    branchId,
    crowd: snapshot.count,
    lastPingAt: snapshot.lastPingAt,
  });
}