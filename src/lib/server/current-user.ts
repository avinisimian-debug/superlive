import type { NextRequest } from "next/server";
import type { AuthUser } from "@/lib/types";
import { SESSION_COOKIE, getSession, getUser } from "./auth-store";

/** Resolves the logged-in user for a request, or null. */
export async function currentUser(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await getSession(token);
  if (!session) return null;
  return getUser(session.email);
}
