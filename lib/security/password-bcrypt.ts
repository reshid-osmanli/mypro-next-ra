// ============================================================================
// lib/security/password-bcrypt.ts — Drop-in replacement for lib/password.ts
// ----------------------------------------------------------------------------
// New file: /lib/security/password-bcrypt.ts (or replace /lib/password.ts)
// Uses bcryptjs (no native deps) for portability on Vercel.
// ============================================================================

import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, ROUNDS);
}

export async function hashPasswordAsync(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

export async function verifyPasswordAsync(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export function needsRehash(hash: string): boolean {
  // Bcrypt format: $2a$rounds$...
  const match = /^\$2[aby]\$(\d+)\$/.exec(hash);
  if (!match) return true;
  return Number(match[1]) < ROUNDS;
}
