import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { currentUser } from "@/lib/server/current-user";
import {
  ADMIN_EMAILS,
  getActivity,
  getReports,
  getUsers,
} from "@/lib/server/auth-store";
import type { AdminOverview, AuthUser } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [storedUsers, activity, reports] = await Promise.all([
    getUsers(),
    getActivity(200),
    getReports(),
  ]);

  // The owner accounts always appear, even on fresh serverless instances
  // where the per-instance file store has no history yet.
  const users: AuthUser[] = [...storedUsers];
  for (const email of ADMIN_EMAILS) {
    if (!users.some((u) => u.email === email)) {
      const now = new Date().toISOString();
      users.push({
        email,
        role: "admin",
        createdAt: now,
        lastLoginAt: now,
      });
    }
  }

  const today = new Date().toDateString();
  const loginsToday = activity.filter(
    (e) => e.type === "login" && new Date(e.at).toDateString() === today,
  ).length;

  const overview: AdminOverview = {
    stats: {
      totalUsers: users.length,
      loginsToday,
      totalReports: reports.length,
    },
    users: [...users].sort((a, b) =>
      b.lastLoginAt.localeCompare(a.lastLoginAt),
    ),
    activity,
  };

  return NextResponse.json(overview);
}
