import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { currentUser } from "@/lib/server/current-user";
import { getActivity, getReports, getUsers } from "@/lib/server/auth-store";
import type { AdminOverview } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [users, activity, reports] = await Promise.all([
    getUsers(),
    getActivity(200),
    getReports(),
  ]);

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
