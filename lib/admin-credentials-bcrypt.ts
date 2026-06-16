// ============================================================================
// lib/admin-credentials.ts — Production-ready version using bcrypt only
// ----------------------------------------------------------------------------
// New file: /lib/admin-credentials.ts (replaces the existing plaintext env-fallback version)
// - Removes the plaintext ADMIN_PASSWORD env comparison completely
// - Forces admin passwords to live ONLY in the AdminUser table (hashed)
// - Provides one-time env-based bootstrap so existing setups keep working
// ============================================================================

import { prisma } from "@/lib/db";
import { hashPasswordAsync, verifyPasswordAsync } from "@/lib/security/password-bcrypt";

export type AdminCredentialRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  active: boolean;
};

const SEEN_BOOTSTRAP = new Set<string>();

/**
 * One-time env-based bootstrap: ADMIN_EMAIL + ADMIN_BOOTSTRAP_PASSWORD
 * Lets an initial admin be created from environment on first deploy.
 * Subsequent boots are no-ops.
 */
export async function bootstrapAdminFromEnv(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
  if (!email || !password || password.length < 12) return;
  if (SEEN_BOOTSTRAP.has(email)) return;

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    SEEN_BOOTSTRAP.add(email);
    return;
  }

  const passwordHash = await hashPasswordAsync(password);
  await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      role: "admin",
      active: true,
    },
  });
  SEEN_BOOTSTRAP.add(email);
  console.info(`[admin] Bootstrapped admin user ${email} from env.`);
}

export async function findActiveAdminByEmail(
  email: string
): Promise<AdminCredentialRecord | null> {
  const normalized = email.trim().toLowerCase();

  try {
    const admin = await prisma.adminUser.findUnique({ where: { email: normalized } });
    if (admin?.active) {
      return {
        id: admin.id,
        email: admin.email,
        passwordHash: admin.passwordHash,
        role: admin.role,
        active: admin.active,
      };
    }
  } catch (error) {
    console.warn("[admin] Database lookup failed", error);
    return null;
  }

  return null;
}

export async function verifyAdminPassword(
  password: string,
  admin: AdminCredentialRecord
): Promise<boolean> {
  if (!admin.passwordHash) return false;
  return verifyPasswordAsync(password, admin.passwordHash);
}
