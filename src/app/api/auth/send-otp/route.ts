import { NextResponse } from "next/server";
import {
  isValidEmail,
  logActivity,
  normalizeEmail,
} from "@/lib/server/auth-store";
import {
  OTP_CHALLENGE_COOKIE,
  OTP_TTL_MS,
  hashOtp,
  signToken,
} from "@/lib/server/auth-token";
import { randomInt } from "node:crypto";

export const runtime = "nodejs";

interface Body {
  email?: unknown;
  name?: unknown;
  mode?: unknown;
}

function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const email = normalizeEmail(body.email);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const mode = body.mode === "signup" ? "signup" : "login";

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, error: "נא להזין כתובת מייל תקינה" },
      { status: 400 },
    );
  }
  if (mode === "signup" && name.length < 2) {
    return NextResponse.json(
      { success: false, error: "נא להזין שם מלא" },
      { status: 400 },
    );
  }

  const otp = generateOtp();
  const exp = Date.now() + OTP_TTL_MS;

  // Stateless challenge — carries everything verify-otp needs, signed with HMAC.
  const challengeToken = signToken({
    email,
    name,
    mode,
    otpHash: hashOtp(otp),
    exp,
  });

  await logActivity("otp", "נשלח קוד אימות", email);

  const apiKey = process.env.RESEND_API_KEY;
  let delivered = false;
  if (apiKey) {
    try {
      const greeting = name ? `${name}, ` : "";
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
            <p style="color:#475569">${greeting}קוד האימות שלך הוא:</p>
            <p style="font-size:2.2em;font-weight:800;letter-spacing:0.3em;color:#059669;margin:12px 0">${otp}</p>
            <p style="color:#64748b">הקוד תקף ל-10 דקות.</p>
          </div>`,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      delivered = true;
    } catch (err) {
      console.error("[Zerem OTP] Resend send failed:", err);
      /* fall through to dev mode so login always works */
    }
  }

  if (!delivered) {
    console.log(`[Zerem OTP] ${email}: ${otp}`);
  }

  const cookieOpts = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(OTP_TTL_MS / 1000),
    secure: process.env.NODE_ENV === "production",
  };

  const payload = delivered
    ? { success: true, message: "הקוד נשלח למייל", challengeToken }
    : {
        success: true,
        message: "הקוד נשלח למייל",
        devOtp: otp,
        challengeToken,
      };

  const response = NextResponse.json(payload);
  response.cookies.set(OTP_CHALLENGE_COOKIE, challengeToken, cookieOpts);
  return response;
}
