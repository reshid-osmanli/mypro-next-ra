import { prisma } from "./db";

export const AFFILIATE_COOKIE = "kutubi_ref";
const DEFAULT_COMMISSION_RATE = 10;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function sanitizeCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
}

function randomCode(email: string) {
  const prefix = normalizeEmail(email).split("@")[0]?.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase() || "TEACHER";
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${suffix}`;
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const target = `${name}=`;
  const part = cookieHeader.split(";").map((item) => item.trim()).find((item) => item.startsWith(target));
  if (!part) return null;
  return decodeURIComponent(part.slice(target.length));
}

export async function getOrCreateAffiliateProfile(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await prisma.affiliateProfile.findUnique({ where: { email: normalizedEmail } });
  if (existing) return existing;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomCode(normalizedEmail);
    try {
      return await prisma.affiliateProfile.create({
        data: {
          email: normalizedEmail,
          code,
          commissionRate: DEFAULT_COMMISSION_RATE,
          active: true
        }
      });
    } catch (error) {
      if (attempt === 7) throw error;
    }
  }

  throw new Error("تعذر إنشاء كود التسويق بالعمولة");
}

export async function getAffiliateAttributionFromRequest(req: Request, orderEmail: string) {
  const code = sanitizeCode(getCookieValue(req.headers.get("cookie"), AFFILIATE_COOKIE) ?? "");
  if (!code) return null;

  const profile = await prisma.affiliateProfile.findUnique({ where: { code } });
  if (!profile?.active) return null;
  if (normalizeEmail(profile.email) === normalizeEmail(orderEmail)) return null;

  return {
    affiliateCode: profile.code,
    affiliateEmail: profile.email
  };
}

export async function applyAffiliateCommission(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      email: true,
      total: true,
      status: true,
      affiliateEmail: true,
      affiliateCommission: true
    }
  });

  if (!order || order.status !== "paid" || !order.affiliateEmail || order.affiliateCommission > 0) return null;
  if (normalizeEmail(order.email) === normalizeEmail(order.affiliateEmail)) return null;

  const profile = await prisma.affiliateProfile.findUnique({ where: { email: normalizeEmail(order.affiliateEmail) } });
  if (!profile?.active) return null;

  const amount = Math.max(0, Math.round(order.total * (profile.commissionRate / 100)));
  if (amount <= 0) return null;

  try {
    const commission = await prisma.$transaction(async (tx) => {
      const created = await tx.affiliateCommission.create({
        data: {
          affiliateId: profile.id,
          orderId: order.id,
          orderEmail: order.email,
          amount,
          rate: profile.commissionRate,
          status: "credited"
        }
      });

      const wallet = await tx.userWallet.upsert({
        where: { email: profile.email },
        update: { balance: { increment: amount } },
        create: { email: profile.email, balance: amount }
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "credit",
          amount,
          description: `عمولة تسويق ${profile.commissionRate}% على الطلب #${order.id.slice(-8)}`,
          orderId: order.id
        }
      });

      await tx.order.update({ where: { id: order.id }, data: { affiliateCommission: amount } });
      return created;
    });

    return commission;
  } catch (error) {
    // Unique orderId means the commission was already handled by a concurrent/payment retry request.
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
    if (code === "P2002") return null;
    throw error;
  }
}
