import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { recordAnalyticsEvent } from "@/lib/server/analytics-store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const event = typeof body.event === "string" ? body.event : req.nextUrl.searchParams.get("event");
    if (!event) {
      return NextResponse.json({ error: "missing_event" }, { status: 400 });
    }
    const count = await recordAnalyticsEvent(event);
    return NextResponse.json({ success: true, event, count });
  } catch (err) {
    console.error("analytics track error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const event = req.nextUrl.searchParams.get("event");
  if (!event) {
    return NextResponse.json({ error: "missing_event" }, { status: 400 });
  }
  const count = await recordAnalyticsEvent(event);
  return NextResponse.json({ success: true, event, count });
}
