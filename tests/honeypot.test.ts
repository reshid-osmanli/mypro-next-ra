// ============================================================================
// tests/honeypot.test.ts
// ----------------------------------------------------------------------------
// New file: /tests/honeypot.test.ts
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isHoneypotTriggered, isSubmittedTooFast, verifyHoneypot } from "@/lib/security/honeypot";

describe("honeypot", () => {
  it("triggers on filled honeypot field", () => {
    expect(isHoneypotTriggered({ fields: { website: "https://spam.com" } })).toBe(true);
  });

  it("passes on empty honeypot", () => {
    expect(isHoneypotTriggered({ fields: { website: "" } })).toBe(false);
  });

  it("flags too-fast submissions", () => {
    expect(isSubmittedTooFast({ renderedAt: Date.now() - 100 })).toBe(true);
  });

  it("passes normal-speed submissions", () => {
    expect(isSubmittedTooFast({ renderedAt: Date.now() - 5000 })).toBe(false);
  });

  it("verifyHoneypot returns ok when clean", async () => {
    const result = await verifyHoneypot({ renderedAt: Date.now() - 5000, fields: {} });
    expect(result.ok).toBe(true);
  });

  it("verifyHoneypot rejects triggered honeypot", async () => {
    const result = await verifyHoneypot({ renderedAt: Date.now() - 5000, fields: { website: "x" } });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("honeypot_triggered");
  });
});
