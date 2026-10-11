import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  logActivity,
  normalizeEmail,
  roleForEmail,
  upsertUser,
} from "@/lib/server/auth-store";
import {
  OTP_CHALLENGE_COOKIE,
  SESSION_TTL_MS,
  hashOtp,
  signToken,
  verifyToken,
} from "@/lib/server/auth-token";

export const runtime = "nodejs";

interface Body {
  email?: unknown;
  code?: unknown;
  challengeToken?: unknown;
}

interface Challenge {
  email?: string;
  name?: string;
  mode?: string;
  otpHash?: string;
  exp?: number;
}

export async function POST(req: NextRequest) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  const bodyToken =
    typeof body.challengeToken === "string" ? body.challengeToken : "";
  const cookieToken = req.cookies.get(OTP_CHALLENGE_COOKIE)?.value ?? "";
  const challenge = verifyToken<Challenge>(bodyToken || cookieToken);

  if (!challenge) {
    return NextResponse.json(
      { success: false, error: "פג תוקף החיבור. נא לשלוח קוד חדש" },
      { status: 400 },
    );
  }
  if (!challenge.exp || Date.now() > challenge.exp) {
    return NextResponse.json(
      { success: false, error: "הקוד פג תוקף. נא לשלוח קוד חדש" },
      { status: 400 },
    );
  }

  const challengeEmail = normalizeEmail(challenge.email);
  const providedEmail = normalizeEmail(body.email);
  if (providedEmail && providedEmail !== challengeEmail) {
    return NextResponse.json(
      { success: false, error: "המייל אינו תואם לבקשה. נא לשלוח קוד חדש" },
      { status: 400 },
    );
  }

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { success: false, error: "נא להזין קוד בן 6 ספרות" },
      { status: 400 },
    );
  }
  if (hashOtp(code) !== challenge.otpHash) {
    return NextResponse.json(
      { success: false, error: "קוד שגוי, נסו שוב" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const role = roleForEmail(challengeEmail);
  const name = (challenge.name || "").trim();

  // Best-effort persistence for the admin dashboard (may be per-instance).
  const user = await upsertUser(challengeEmail, role, now, name || undefined);
  await logActivity(
    "login",
    challenge.mode === "signup" ? "הרשמה למערכת" : "התחברות למערכת",
    challengeEmail,
  );

  const sessionToken = signToken({
    email: challengeEmail,
    name: user.name || name || "",
    role,
    createdAt: user.createdAt || now,
    lastLoginAt: now,
    exp: Date.now() + SESSION_TTL_MS,
  });

  const response = NextResponse.json({
    success: true,
    user: {
      email: challengeEmail,
      name: user.name || name || undefined,
      role,
    },
  });
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set(OTP_CHALLENGE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
