import { prisma } from "@/lib/db";
import { verifyPasswordAsync } from "@/lib/security/password-bcrypt";

export type AdminCredentialRecord = {
  email: string;
  passwordHash: string | null;
  envPassword?: string;
  active: boolean;
};

/**
 * Detect if a string looks like a bcrypt hash.
 * Format: $2a$, $2b$, or $2y$ followed by cost and 22 chars of salt + 31 chars of hash.
 */
function isBcryptHash(value: string): boolean {
  return /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

/**
 * Detect if a string looks like a scrypt hash (salt:hashHex format).
 */
function isScryptHash(value: string): boolean {
  return /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(value);
}

/**
 * Check if ADMIN_PASSWORD should be treated as a pre-hashed bcrypt value.
 * If the env var looks like a bcrypt hash, we use it directly.
 * Otherwise, we hash it on first admin creation.
 */
function getConfiguredAdminPassword(): string | null {
  const raw = process.env.ADMIN_PASSWORD?.trim() || null;
  if (!raw) return null;

  // If it looks like a bcrypt hash, treat it as pre-hashed.
  // If it looks like a scrypt hash, treat it as pre-hashed (legacy).
  // If it's plain text, flag it for hashing on first admin creation.
  if (isBcryptHash(raw) || isScryptHash(raw)) {
    return raw; // Pre-hashed — store as-is
  }

  // Plain text detected — return with special prefix so the caller
  // knows to hash it on first admin creation.
  return `__plaintext__:${raw}`;
}

function configuredAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
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
  const configuredPassword = getConfiguredAdminPassword();

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

/**
 * Bootstrap a bcrypt admin user from env vars if none exists yet.
 * Called on first successful login when ADMIN_PASSWORD is plain text.
 */
export async function bootstrapEnvAdmin(): Promise<void> {
  const email = configuredAdminEmail();
  const rawPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!email || !rawPassword || isBcryptHash(rawPassword) || isScryptHash(rawPassword)) {
    return; // Nothing to bootstrap, or already hashed
  }

  // Check if an admin for this email already exists
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return; // Don't overwrite existing admin

  // Hash the plain text password and create the admin
  const { hashPasswordAsync } = await import("@/lib/security/password-bcrypt");
  const hash = await hashPasswordAsync(rawPassword);

  await prisma.adminUser.upsert({
    where: { email },
    create: { email, passwordHash: hash, role: "admin", active: true },
    update: { passwordHash: hash },
  });

  console.info(`[admin] Bootstrap: created bcrypt admin from ADMIN_EMAIL/ADMIN_PASSWORD env vars`);
}

export async function verifyAdminPassword(password: string, admin: AdminCredentialRecord): Promise<boolean> {
  // DB-stored bcrypt hash — use async bcrypt.compare
  if (admin.passwordHash) {
    // Support legacy scrypt hashes during migration
    if (isScryptHash(admin.passwordHash)) {
      const { verifyPassword } = await import("@/lib/password");
      return verifyPassword(password, admin.passwordHash);
    }
    return verifyPasswordAsync(password, admin.passwordHash);
  }

  // Env-based password
  if (!admin.envPassword) return false;

  // Pre-hashed bcrypt from env — use async bcrypt.compare
  if (isBcryptHash(admin.envPassword)) {
    return verifyPasswordAsync(password, admin.envPassword);
  }

  // Legacy scrypt hash from env
  if (isScryptHash(admin.envPassword)) {
    const { verifyPassword } = await import("@/lib/password");
    return verifyPassword(password, admin.envPassword);
  }

  // Plain text detected — bootstrap on first login
  if (admin.envPassword.startsWith("__plaintext__:")) {
    const plain = admin.envPassword.slice("__plaintext__:".length);

    // Bootstrap: create bcrypt admin in DB
    await bootstrapEnvAdmin();

    // Compare plain text against stored plain text (timing-safe)
    const submitted = Buffer.from(password);
    const expected = Buffer.from(plain);
    if (submitted.length !== expected.length) return false;
    const crypto = await import("node:crypto");
    return crypto.timingSafeEqual(submitted, expected);
  }

  return false;
}
