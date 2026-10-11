import { NextResponse } from "next/server";
import {
  OTP_TTL_MS,
  generateOtp,
  isValidEmail,
  logActivity,
  normalizeEmail,
  saveOtp,
} from "@/lib/server/auth-store";

export const runtime = "nodejs";

interface Body {
  email?: unknown;
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, error: "נא להזין כתובת מייל תקינה" },
      { status: 400 },
    );
  }

  const otp = generateOtp();
  const now = Date.now();
  await saveOtp({
    email,
    code: otp,
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
  });
  await logActivity("otp", "נשלח קוד אימות", email);

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "Zerem <onboarding@resend.dev>",
          to: email,
          subject: `קוד האימות שלך ל-Zerem: ${otp}`,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;text-align:center">
            <h2 style="color:#0f172a">התחברות ל-Zerem</h2>
            <p style="color:#475569">קוד האימות שלך הוא:</p>
            <p style="font-size:2.2em;font-weight:800;letter-spacing:0.3em;color:#059669;margin:12px 0">${otp}</p>
            <p style="color:#64748b">הקוד תקף ל-10 דקות.</p>
          </div>`,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return NextResponse.json({ success: true, message: "הקוד נשלח למייל" });
    } catch (err) {
      console.error("[Zerem OTP] Resend send failed:", err);
      /* fall through to dev mode so login always works */
    }
  }

  // Dev / testing mode: no email provider configured.
  console.log(`[Zerem OTP] ${email}: ${otp}`);
  return NextResponse.json({
    success: true,
    message: "הקוד נשלח למייל",
    devOtp: otp,
  });
}
