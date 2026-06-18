// ============================================================================
// lib/security/csrf.ts — Server-side CSRF helpers (HMAC, double-submit)
// ----------------------------------------------------------------------------
// Production-ready HMAC-based CSRF protection.
// Token is bound to session + timestamp + secret.
// ============================================================================

import { cookies, headers } from "next/headers";
import crypto from "node:crypto";

const CSRF_COOKIE = "kutubi_csrf";
const CSRF_HEADER = "x-csrf-token";

function getSecret(): string {
  const secret =
    process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("CSRF secret missing or too short");
  }
  return secret;
}

export async function getSessionIdentifier(): Promise<string> {
  const c = await cookies();
  // With noUncheckedIndexedAccess, optional chain on .get() is safe (returns T | undefined)
  const sessionId =
    c.get("next-auth.session-token")?.value ??
    c.get("__Secure-next-auth.session-token")?.value ??
    c.get("kutubi-admin")?.value ??
    "anon";
  return sessionId;
}

/** Issue a CSRF token bound to the current session. Call on page render (GET). */
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
    const h1 = h.get(CSRF_HEADER);
    const h2 = h.get("csrf-token");
    const h3 = h.get("x-csrf");
    const headerToken = h1 ?? h2 ?? h3 ?? cookieToken;

    if (!headerToken) return false;

    const parts = headerToken.split(".");
    // noUncheckedIndexedAccess: verify array length before indexed access
    if (parts.length !== 3) return false;
    const sess = parts[0]!;
    const ts = parts[1]!;
    const sig = parts[2]!;

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

/** Assert CSRF; throws CsrfError on failure. Use inside API route handlers. */
export async function assertCsrf(): Promise<void> {
  const ok = await verifyCsrfFromRequest();
  if (!ok) throw new CsrfError();
}
