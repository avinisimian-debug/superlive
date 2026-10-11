import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { currentUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await currentUser(req);
  return NextResponse.json({ user });
}
