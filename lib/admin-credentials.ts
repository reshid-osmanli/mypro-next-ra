import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { timingSafeEqual } from "crypto";

export type AdminCredentialRecord = {
  email: string;
  passwordHash: string | null;
  envPassword?: string;
  active: boolean;
};

function configuredAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
}

function configuredAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || null;
}

export async function findActiveAdminByEmail(email: string): Promise<AdminCredentialRecord | null> {
  const normalized = email.trim().toLowerCase();

  try {
    const admin = await prisma.adminUser.findUnique({ where: { email: normalized } });
    if (admin?.active) {
      return { email: admin.email, passwordHash: admin.passwordHash, active: true };
    }
  } catch (error) {
    console.warn("[admin] Database lookup failed; checking ADMIN_EMAIL env fallback", error);
  }

  const configuredEmail = configuredAdminEmail();
  const configuredPassword = configuredAdminPassword();
  if (configuredEmail === normalized && configuredPassword) {
    return {
      email: configuredEmail,
      passwordHash: null,
      envPassword: configuredPassword,
      active: true
    };
  }

  return null;
}

export function verifyAdminPassword(password: string, admin: AdminCredentialRecord) {
  if (admin.passwordHash) {
    return verifyPassword(password, admin.passwordHash);
  }

  if (!admin.envPassword) return false;

  const submitted = Buffer.from(password);
  const expected = Buffer.from(admin.envPassword);
  if (submitted.length !== expected.length) return false;
  return timingSafeEqual(submitted, expected);
}
