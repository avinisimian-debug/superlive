import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "עברנו להתחברות מהירה עם סיסמה! רעננו את הדף כדי להיכנס.",
    },
    { status: 200 }
  );
}
