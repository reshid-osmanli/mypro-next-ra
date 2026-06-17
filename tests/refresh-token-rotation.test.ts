// ============================================================================
// tests/refresh-token-rotation.test.ts
// ----------------------------------------------------------------------------
// New file: /tests/refresh-token-rotation.test.ts
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the prisma client to avoid DB hits
const mockFamilies: any[] = [];

vi.mock("@/lib/db", () => ({
  prisma: {
    refreshTokenFamily: {
      create: vi.fn((args: any) => {
        const id = `fam_${mockFamilies.length}`;
        const family = { id, ...args.data };
        mockFamilies.push(family);
        return Promise.resolve(family);
      }),
      findUnique: vi.fn(({ where }: any) => {
        const family = mockFamilies.find((f) => f.currentTokenHash === where.currentTokenHash);
        return Promise.resolve(family ?? null);
      }),
      update: vi.fn(({ where, data }: any) => {
        const family = mockFamilies.find((f) => f.id === where.id);
        if (!family) return Promise.resolve(null);
        Object.assign(family, data);
        return Promise.resolve(family);
      }),
      updateMany: vi.fn(({ where, data }: any) => {
        let count = 0;
        for (const f of mockFamilies) {
          if ((!where.userId || f.userId === where.userId) && !f.revokedAt) {
            Object.assign(f, data);
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
    },
  },
}));

import { issueInitialRefreshToken, rotateRefreshToken, revokeFamily, revokeAllForUser } from "@/lib/security/refresh-token-rotation";
import crypto from "node:crypto";

describe("refresh token rotation", () => {
  beforeEach(() => {
    mockFamilies.length = 0;
  });

  it("issues a fresh family and token", async () => {
    const result = await issueInitialRefreshToken({ userId: "u1", email: "u@example.com" });
    expect(result.token).toBeTruthy();
    expect(result.familyId).toMatch(/^fam_/);
    expect(mockFamilies).toHaveLength(1);
  });

  it("rotates a valid token and issues a new one", async () => {
    const issued = await issueInitialRefreshToken({ userId: "u1", email: "u@example.com" });
    const result = await rotateRefreshToken({ presentedToken: issued.token, email: "u@example.com" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.token.token).not.toBe(issued.token);
    }
  });

  it("rejects unknown tokens", async () => {
    const result = await rotateRefreshToken({ presentedToken: "totally-fake", email: "u@example.com" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_found");
  });

  it("revokes entire family on reuse (theft detection)", async () => {
    const issued = await issueInitialRefreshToken({ userId: "u1", email: "u@example.com" });
    await rotateRefreshToken({ presentedToken: issued.token, email: "u@example.com" });
    // Force usedAt to be older than grace
    const fam = mockFamilies[0];
    fam.usedAt = new Date(Date.now() - 5 * 60 * 1000);

    const second = await rotateRefreshToken({ presentedToken: issued.token, email: "u@example.com" });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe("already_used");

    expect(fam.revokedAt).toBeTruthy();
    expect(fam.revokedReason).toBe("reuse_detected");
  });

  it("revokes single family by id", async () => {
    const issued = await issueInitialRefreshToken({ userId: "u1", email: "u@example.com" });
    await revokeFamily({ familyId: issued.familyId, reason: "logout" });
    expect(mockFamilies[0].revokedAt).toBeTruthy();
    expect(mockFamilies[0].revokedReason).toBe("logout");
  });

  it("revokes all families for a user", async () => {
    await issueInitialRefreshToken({ userId: "u1", email: "u@example.com" });
    await issueInitialRefreshToken({ userId: "u1", email: "u@example.com" });
    await issueInitialRefreshToken({ userId: "u2", email: "other@example.com" });

    await revokeAllForUser({ userId: "u1", reason: "password_change" });

    expect(mockFamilies[0].revokedAt).toBeTruthy();
    expect(mockFamilies[1].revokedAt).toBeTruthy();
    expect(mockFamilies[2].revokedAt).toBeFalsy();
  });
});
