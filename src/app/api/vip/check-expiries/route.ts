import { NextResponse } from "next/server";
import { getExpiringVipSubscriptions, markVipExpiryNotified } from "@/lib/server/vip-store";
import { sendVipExpiryAlertEmail } from "@/lib/server/email";

export const runtime = "nodejs";

export async function GET() {
  try {
    const expiring = await getExpiringVipSubscriptions();
    let sentCount = 0;

    for (const sub of expiring) {
      const emailResult = await sendVipExpiryAlertEmail({
        to: sub.email,
        name: sub.name,
        expiresAt: sub.expiresAt,
      });

      if (emailResult.success) {
        await markVipExpiryNotified(sub.id);
        sentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      expiringFound: expiring.length,
      emailsSent: sentCount,
    });
  } catch (err: any) {
    console.error("[api/vip/check-expiries] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
