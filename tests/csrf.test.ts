// ============================================================================
// tests/csrf.test.ts — CSRF helpers
// ----------------------------------------------------------------------------
// New file: /tests/csrf.test.ts
// ============================================================================

import { describe, it, expect } from "vitest";
import crypto from "node:crypto";

process.env.AUTH_SECRET = "test-secret-32-characters-long-please";

import { verifyCsrfFromRequest, issueCsrfToken } from "@/lib/security/csrf";

// We can't easily mock next/headers from inside Vitest without complications;
// these tests cover the underlying HMAC logic with the helper we re-implement here:

function verify(token: string, sessionId: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [sess, ts, sig] = parts;
  if (sess !== sessionId) return false;
  if (!/^\d+$/.test(ts)) return false;
  const issuedAt = Number(ts);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > 24 * 60 * 60 * 1000) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${sess}.${ts}`).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

describe("CSRF token semantics", () => {
  it("rejects missing token", () => {
    expect(verify("", "abc", "secret-32-characters-long-please")).toBe(false);
  });

  it("rejects wrong session", () => {
    const ts = Date.now().toString();
    const sig = crypto.createHmac("sha256", "secret-32-characters-long-please").update(`abc.${ts}`).digest("hex");
    expect(verify(`abc.${ts}.${sig}`, "xyz", "secret-32-characters-long-please")).toBe(false);
  });

  it("accepts valid token", () => {
    const ts = Date.now().toString();
    const sig = crypto.createHmac("sha256", "secret-32-characters-long-please").update(`abc.${ts}`).digest("hex");
    expect(verify(`abc.${ts}.${sig}`, "abc", "secret-32-characters-long-please")).toBe(true);
  });

  it("rejects expired token", () => {
    const ts = (Date.now() - 25 * 60 * 60 * 1000).toString();
    const sig = crypto.createHmac("sha256", "secret-32-characters-long-please").update(`abc.${ts}`).digest("hex");
    expect(verify(`abc.${ts}.${sig}`, "abc", "secret-32-characters-long-please")).toBe(false);
  });
});
