import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  createUser,
  isValidEmail,
  logActivity,
  normalizeEmail,
} from "@/lib/server/auth-store";
import { signToken } from "@/lib/server/auth-token";

export const runtime = "nodejs";

interface Body {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2) {
    return NextResponse.json(
      { success: false, error: "נא להזין שם מלא (לפחות 2 תווים)" },
      { status: 400 },
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, error: "נא להזין כתובת מייל תקינה" },
      { status: 400 },
    );
  }
  if (password.length < 4) {
    return NextResponse.json(
      { success: false, error: "הסיסמה חייבת להכיל לפחות 4 תווים" },
      { status: 400 },
    );
  }

  const user = await createUser({ name, email, password });
  if (!user) {
    return NextResponse.json(
      { success: false, error: "משתמש קיים כבר עם מייל זה" },
      { status: 409 },
    );
  }

  await logActivity("login", "הרשמה למערכת", user.email);

  const token = signToken({
    id: user.id,
    name: user.name || "",
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
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