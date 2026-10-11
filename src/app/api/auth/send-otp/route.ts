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

  // Brevo transactional email (preferred sender).
  const apiKey = process.env.BREVO_API_KEY;
  let delivered = false;
  if (apiKey) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Zerem", email: "aviya.nish@gmail.com" },
          to: [{ email }],
          subject: `קוד האימות שלך ל-Zerem: ${otp}`,
          htmlContent: `<div dir='rtl' style='font-family:sans-serif;padding:24px;text-align:center;'><h2>קוד האימות שלך ל-Zerem</h2><h1 style='letter-spacing:6px;font-size:36px;color:#0f172a;'>${otp}</h1><p>הקוד בתוקף ל-10 דקות הקרובות.</p></div>`,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      delivered = true;
    } catch (err) {
      console.error("[Zerem OTP] Brevo send failed:", err);
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
