import type { NextRequest } from "next/server";
import type { AuthUser } from "@/lib/types";
import { SESSION_COOKIE } from "./auth-store";
import { verifyToken } from "./auth-token";

interface SessionPayload {
  id?: string;
  email?: string;
  name?: string;
  role?: AuthUser["role"];
  createdAt?: string;
  lastLoginAt?: string;
  exp?: number;
}

/**
 * Resolves the logged-in user from the signed `zerem_session` cookie.
 *
 * The cookie is an HMAC-signed, self-contained payload, so it resolves
 * identically on every serverless instance with no shared storage.
 */
export async function currentUser(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = verifyToken<SessionPayload>(token);
  if (!payload?.email || !payload.exp || Date.now() > payload.exp) {
    return null;
  }
  return {
    id: payload.id,
    email: payload.email,
    name: payload.name || undefined,
    role: payload.role === "admin" ? "admin" : "user",
    createdAt: payload.createdAt || new Date().toISOString(),
    lastLoginAt: payload.lastLoginAt || new Date().toISOString(),
  };
}