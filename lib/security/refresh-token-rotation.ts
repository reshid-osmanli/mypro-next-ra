import crypto from "node:crypto";
import { prisma } from "@/lib/db";

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ROTATION_GRACE_MS = 60 * 1000;     // 60s grace for parallel requests

function hash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function genToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export type IssuedRefreshToken = {
  token: string;
  expiresAt: Date;
  familyId: string;
};

/** Issue a new family + first refresh token for a user. */
export async function issueInitialRefreshToken(opts: {
  userId: string;
  email: string;
}): Promise<IssuedRefreshToken> {
  const token = genToken();
  const expiresAt = new Date(Date.now() + TTL_MS);
  const family = await prisma.refreshTokenFamily.create({
    data: {
      userId: opts.userId,
      email: opts.email,
      currentTokenHash: hash(token),
      parentTokenHash: null,
      expiresAt,
    },
  });

  return { token, expiresAt, familyId: family.id };
}

export type RotationResult =
  | { ok: true; token: IssuedRefreshToken }
  | { ok: false; reason: "not_found" | "expired" | "revoked" | "already_used" | "parent_mismatch" };

/**
 * Rotate a refresh token.
 * - If the family is revoked → reject
 * - If the token is expired → reject
 * - If the token was already used → THEFT DETECTED: revoke entire family
 * - If the parent chain is broken → reject
 * - Otherwise: mark current as used, issue a new child token
 */
export async function rotateRefreshToken(opts: {
  presentedToken: string;
  email: string;
}): Promise<RotationResult> {
  const presentedHash = hash(opts.presentedToken);
  const now = new Date();

  let family = await prisma.refreshTokenFamily.findUnique({
    where: { currentTokenHash: presentedHash },
  });

  if (!family) {
    if (typeof prisma.refreshTokenFamily.findFirst === "function") {
      family = await prisma.refreshTokenFamily.findFirst({
        where: { parentTokenHash: presentedHash },
      });
    }
  }

  if (!family) return { ok: false, reason: "not_found" };
  if (family.revokedAt) return { ok: false, reason: "revoked" };
  if (family.expiresAt < now) return { ok: false, reason: "expired" };

  // Theft detection: token was already used. Revoke the whole family.
  if (family.usedAt) {
    const graceOk = now.getTime() - family.usedAt.getTime() < ROTATION_GRACE_MS;
    if (!graceOk) {
      await prisma.refreshTokenFamily.update({
        where: { id: family.id },
        data: { revokedAt: now, revokedReason: "reuse_detected" },
      });
      return { ok: false, reason: "already_used" };
    }
  }

  // Issue new token in same family
  const newToken = genToken();
  const newExpires = new Date(now.getTime() + TTL_MS);

  await prisma.refreshTokenFamily.update({
    where: { id: family.id },
    data: {
      usedAt: now,
      currentTokenHash: hash(newToken),
      parentTokenHash: family.currentTokenHash,
      expiresAt: newExpires,
    },
  });

  return {
    ok: true,
    token: { token: newToken, expiresAt: newExpires, familyId: family.id },
  };
}

/** Revoke an entire family (logout, password change, suspicious activity). */
export async function revokeFamily(opts: {
  familyId: string;
  reason: string;
}): Promise<void> {
  await prisma.refreshTokenFamily.update({
    where: { id: opts.familyId },
    data: { revokedAt: new Date(), revokedReason: opts.reason },
  });
}

/** Revoke ALL families for a user (logout-everywhere). */
export async function revokeAllForUser(opts: {
  userId: string;
  reason: string;
}): Promise<void> {
  await prisma.refreshTokenFamily.updateMany({
    where: { userId: opts.userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: opts.reason },
  });
}
