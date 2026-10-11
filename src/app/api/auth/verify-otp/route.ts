import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  createSession,
  deleteOtp,
  getOtp,
  isValidEmail,
  logActivity,
  normalizeEmail,
  upsertUser,
} from "@/lib/server/auth-store";

export const runtime = "nodejs";

interface Body {
  email?: unknown;
  code?: unknown;
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const email = normalizeEmail(body.email);
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, error: "נא להזין כתובת מייל תקינה" },
      { status: 400 },
    );
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { success: false, error: "נא להזין קוד בן 6 ספרות" },
      { status: 400 },
    );
  }

  const record = await getOtp(email);
  if (!record) {
    return NextResponse.json(
      { success: false, error: "לא נמצא קוד מתאים. נא לשלוח קוד חדש" },
      { status: 400 },
    );
  }
  if (Date.now() > record.expiresAt) {
    await deleteOtp(email);
    return NextResponse.json(
      { success: false, error: "הקוד פג תוקף. נא לשלוח קוד חדש" },
      { status: 400 },
    );
  }
  if (record.code !== code) {
    return NextResponse.json(
      { success: false, error: "קוד שגוי, נסו שוב" },
      { status: 400 },
    );
  }

  await deleteOtp(email);

  const user = await upsertUser(email, "user", new Date().toISOString());
  const session = await createSession(email);
  await logActivity("login", "התחברות למערכת", email);

  const res = NextResponse.json({ success: true, user });
  res.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
