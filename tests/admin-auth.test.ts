// ============================================================================
// tests/admin-auth.test.ts — Unit tests for admin session + OTP
// ----------------------------------------------------------------------------
// New file: /tests/admin-auth.test.ts
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to provide an env secret BEFORE the module imports
process.env.ADMIN_SESSION_SECRET = "test-secret-32-characters-long-please";

import {
  signAdminSession,
  readAdminSession,
  issueAdminLoginChallenge,
  readAdminLoginChallenge,
  hashAdminLoginCode,
} from "@/lib/admin-auth";

describe("admin session", () => {
  it("rejects empty token", () => {
    expect(readAdminSession(null)).toBe(false);
    expect(readAdminSession("")).toBe(false);
  });

  it("rejects malformed token", () => {
    expect(readAdminSession("not-a-token")).toBe(false);
    expect(readAdminSession("only.two")).toBe(false);
  });

  it("round-trips a valid session", () => {
    const token = signAdminSession("admin@example.com", 60);
    const result = readAdminSession(token);
    expect(result).not.toBe(false);
    if (result) expect(result.email).toBe("admin@example.com");
  });

  it("rejects expired session", () => {
    const token = signAdminSession("admin@example.com", -1);
    expect(readAdminSession(token)).toBe(false);
  });
});

describe("admin login challenge", () => {
  it("issues a challenge with a code and token", () => {
    const { code, token } = issueAdminLoginChallenge("admin@example.com");
    expect(code).toMatch(/^\d{8}$/);
    expect(token.length).toBeGreaterThan(20);
  });

  it("reads a valid challenge token", () => {
    const { code, token } = issueAdminLoginChallenge("admin@example.com");
    const read = readAdminLoginChallenge(token);
    expect(read).not.toBeNull();
    expect(read?.email).toBe("admin@example.com");
  });

  it("rejects tampered tokens", () => {
    const { token } = issueAdminLoginChallenge("admin@example.com");
    const tampered = token.slice(0, -2) + "00";
    expect(readAdminLoginChallenge(tampered)).toBeNull();
  });

  it("hashes OTP code deterministically per email+expiry", () => {
    const ts = Date.now() + 600_000;
    const a = hashAdminLoginCode("12345678", "x@example.com", ts);
    const b = hashAdminLoginCode("12345678", "x@example.com", ts);
    const c = hashAdminLoginCode("87654321", "x@example.com", ts);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
