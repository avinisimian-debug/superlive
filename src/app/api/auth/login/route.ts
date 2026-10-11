import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  getStoredUser,
  logActivity,
  normalizeEmail,
  touchLastLogin,
  verifyPassword,
} from "@/lib/server/auth-store";
import { signToken } from "@/lib/server/auth-token";

export const runtime = "nodejs";

interface Body {
  email?: unknown;
  password?: unknown;
}

const INVALID = { success: false, error: "מייל או סיסמה שגויים" };

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  const user = email ? await getStoredUser(email) : null;
  if (!user || !password || !verifyPassword(user, password)) {
    return NextResponse.json(INVALID, { status: 401 });
  }

  await touchLastLogin(user.email);
  await logActivity("login", "התחברות למערכת", user.email);

  const now = new Date().toISOString();
  const token = signToken({
    id: user.id,
    name: user.name || "",
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: now,
    exp: Date.now() + SESSION_TTL_MS,
  });

  const response = NextResponse.json({
    success: true,
    user: { name: user.name, email: user.email, role: user.role },
  });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}