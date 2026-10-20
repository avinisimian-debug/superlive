import { NextResponse } from "next/server";
import { saveVipSubscription } from "@/lib/server/vip-store";
import { sendVipWelcomeEmail } from "@/lib/server/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, method, authCode } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "נא להזין כתובת מייל תקינה" }, { status: 400 });
    }

    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const code = authCode || `ZR-${Math.floor(100000 + Math.random() * 900000)}`;

    const record = await saveVipSubscription({
      email: email.trim().toLowerCase(),
      name: name?.trim() || undefined,
      method: method || "Bit / PayBox",
      authCode: code,
      activatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    });

    // Send welcome confirmation email
    await sendVipWelcomeEmail({
      to: record.email,
      name: record.name,
      authCode: record.authCode,
      expiresAt: record.expiresAt,
      method: record.method,
    });

    return NextResponse.json({
      success: true,
      authCode: record.authCode,
      expiresAt: record.expiresAt,
      email: record.email,
    });
  } catch (err: any) {
    console.error("[api/vip/activate] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to activate VIP" }, { status: 500 });
  }
}
