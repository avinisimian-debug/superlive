import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { currentUser } from "@/lib/server/current-user";
import { ADMIN_EMAILS, getPublicUsers } from "@/lib/server/auth-store";
import type { AuthUser } from "@/lib/types";

export const runtime = "nodejs";

/** Admin-only list of registered accounts (password material excluded). */
export async function GET(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const users: AuthUser[] = await getPublicUsers();
  for (const email of ADMIN_EMAILS) {
    if (!users.some((u) => u.email === email)) {
      const now = new Date().toISOString();
      users.push({ email, role: "admin", createdAt: now, lastLoginAt: now });
    }
  }
  users.sort((a, b) => b.lastLoginAt.localeCompare(a.lastLoginAt));

  return NextResponse.json({ users });
}