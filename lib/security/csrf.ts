// ============================================================================
// lib/security/csrf.ts — Server-side CSRF helpers (HMAC, double-submit)
// ----------------------------------------------------------------------------
// New file: /lib/security/csrf.ts
// Use this in API routes to verify CSRF token from the request header.
// ============================================================================

import { cookies, headers } from "next/headers";
import crypto from "node:crypto";

const CSRF_COOKIE = "kutubi_csrf";
const CSRF_HEADER = "x-csrf-token";

function getSecret() {
  const secret =
    process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("CSRF secret missing or too short");
  }
  return secret;
}

export async function getSessionIdentifier(): Promise<string> {
  const c = await cookies();
  const sessionId =
    c.get("next-auth.session-token")?.value ??
    c.get("__Secure-next-auth.session-token")?.value ??
    c.get("kutubi-admin")?.value ??
    "anon";
  return sessionId;
}

/** Issue a CSRF token bound to the current session. Use on render or first GET. */
export async function issueCsrfToken(): Promise<string> {
  const sessionId = await getSessionIdentifier();
  const issuedAt = Date.now().toString();
  const payload = `${sessionId}.${issuedAt}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  const token = `${payload}.${sig}`;

  const c = await cookies();
  c.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return token;
}

/** Verify the token provided in the request against the session and the secret. */
export async function verifyCsrfFromRequest(): Promise<boolean> {
  try {
    const sessionId = await getSessionIdentifier();
    const c = await cookies();
    const cookieToken = c.get(CSRF_COOKIE)?.value ?? "";
    const h = await headers();
    const headerToken =
      h.get(CSRF_HEADER) ?? h.get("csrf-token") ?? h.get("x-csrf") ?? cookieToken;

    if (!headerToken) return false;

    const parts = headerToken.split(".");
    if (parts.length !== 3) return false;
    const [sess, ts, sig] = parts;
    if (sess !== sessionId) return false;
    if (!/^\d+$/.test(ts)) return false;
    const issuedAt = Number(ts);
    if (!Number.isFinite(issuedAt)) return false;
    if (Date.now() - issuedAt > 24 * 60 * 60 * 1000) return false;

    const expected = crypto
      .createHmac("sha256", getSecret())
      .update(`${sess}.${ts}`)
      .digest("hex");

    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Throws a typed error when CSRF fails; use inside API routes. */
export class CsrfError extends Error {
  constructor() {
    super("CSRF validation failed");
    this.name = "CsrfError";
  }
}

export async function assertCsrf(): Promise<void> {
  const ok = await verifyCsrfFromRequest();
  if (!ok) throw new CsrfError();
}
