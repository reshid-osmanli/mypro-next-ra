/**
 * @deprecated lib/password.ts — Legacy scrypt-based password module.
 *
 * This module exists ONLY for migrating existing scrypt-stored hashes to bcrypt.
 * - New password hashing: use lib/security/password-bcrypt.ts (bcrypt, 12 rounds)
 * - Verification: use lib/security/password-bcrypt.ts (bcrypt.compareSync/async)
 *
 * This file will be removed once all AdminUser.passwordHash values are migrated to bcrypt.
 * Migration script: lib/security/migrate-passwords.ts (TODO: create if not exists)
 *
 * DO NOT use this for new password operations.
 */

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const derived = scryptSync(password, salt, 64) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string) {
  // Legacy scrypt format: salt:hashHex
  if (!storedHash.includes(":")) {
    return false;
  }

  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const derived = scryptSync(password, salt, 64) as Buffer;
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}
