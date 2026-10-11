import { NextResponse } from "next/server";
import { SESSION_COOKIE, logActivity } from "@/lib/server/auth-store";

export const runtime = "nodejs";

export async function POST() {
  await logActivity("login", "התנתקות מהמערכת");

  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}