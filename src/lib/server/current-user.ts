import type { NextRequest } from "next/server";
import type { AuthUser } from "@/lib/types";
import { SESSION_COOKIE, getSession, getUser } from "./auth-store";
import { verifyToken } from "./auth-token";

interface SessionPayload {
  email?: string;
  name?: string;
  role?: AuthUser["role"];
  createdAt?: string;
  lastLoginAt?: string;
  exp?: number;
}

/**
 * Resolves the logged-in user for a request, or null.
 *
 * Primary path is the stateless HMAC-signed session cookie (works across
 * serverless instances). The legacy disk-backed session is kept as a fallback
 * so existing sessions aren't invalidated on deploy.
 */
export async function currentUser(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  const payload = verifyToken<SessionPayload>(token);
  if (payload?.email && payload.exp && Date.now() <= payload.exp) {
    return {
      email: payload.email,
      name: payload.name || undefined,
      role: payload.role === "admin" ? "admin" : "user",
      createdAt: payload.createdAt || new Date().toISOString(),
      lastLoginAt: payload.lastLoginAt || new Date().toISOString(),
    };
  }

  const session = await getSession(token);
  if (!session) return null;
  return getUser(session.email);
}
