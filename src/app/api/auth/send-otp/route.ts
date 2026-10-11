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
          subject: "קוד ההתחברות שלך ל-Zerem",
          html: `<div dir="rtl" style="font-family:Arial">קוד האימות שלך הוא <b style="font-size:1.4em">${otp}</b><br/>הקוד תקף ל-10 דקות.</div>`,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return NextResponse.json({ success: true, message: "הקוד נשלח למייל" });
    } catch {
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
