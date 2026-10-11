import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless auth primitives.
 *
 * Vercel runs each request on an arbitrary lambda instance, so any session
 * state kept in a file or in process memory is NOT shared between requests.
 * Everything here is therefore self-contained inside an HMAC-signed token that
 * travels with the browser in a cookie — zero shared-disk dependencies.
 */

const SECRET =
  process.env.AUTH_SECRET ||
  "zerem-static-auth-secret-v1-change-me-by-setting-AUTH_SECRET";

function hmac(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

/** Signs a JSON payload into `base64url(payload).base64url(hmac)` form. */
export function signToken(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${body}.${hmac(body)}`;
}

/** Verifies signature and returns the payload, or null when tampered/invalid. */
export function verifyToken<T = Record<string, unknown>>(
  token: string | undefined | null,
): T | null {
  if (!token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmac(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}