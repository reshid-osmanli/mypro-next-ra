import { prisma } from "./db";
import type { GiftVoucher, UserWallet, WalletTransactionType } from "./types";

const WALLET_RESERVATION_TTL_MS = 45 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeVoucherCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export async function releaseExpiredWalletReservations(email?: string) {
  const now = new Date();
  const where = {
    status: "reserved",
    expiresAt: { lt: now },
    ...(email ? { email: normalizeEmail(email) } : {})
  };

  const expired = await prisma.walletReservation.findMany({ where });
  for (const reservation of expired) {
    await prisma.$transaction(async (tx) => {
      const locked = await tx.walletReservation.updateMany({
        where: { id: reservation.id, status: "reserved" },
        data: { status: "released" }
      });
      if (locked.count !== 1) return;

      await tx.userWallet.upsert({
        where: { email: reservation.email },
        update: { balance: { increment: reservation.amount } },
        create: { email: reservation.email, balance: reservation.amount }
      });
    });
  }
}

export async function getOrCreateWallet(email: string): Promise<UserWallet> {
  const normalizedEmail = normalizeEmail(email);
  await releaseExpiredWalletReservations(normalizedEmail).catch(() => null);

  const wallet = await prisma.userWallet.upsert({
    where: { email: normalizedEmail },
    update: {},
    create: { email: normalizedEmail },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } }
  });

  return {
    balance: wallet.balance,
    transactions: wallet.transactions.map((t) => ({
      id: t.id,
      type: t.type as WalletTransactionType,
      amount: t.amount,
      description: t.description,
      orderId: t.orderId,
      createdAt: t.createdAt.toISOString()
    }))
  };
}

export async function creditWallet(
  email: string,
  amount: number,
  description: string,
  orderId?: string
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const safeAmount = Math.max(0, Math.round(amount));
  if (safeAmount <= 0) throw new Error("قيمة الإيداع غير صالحة");

  await prisma.$transaction(async (tx) => {
    const wallet = await tx.userWallet.upsert({
      where: { email: normalizedEmail },
      update: { balance: { increment: safeAmount } },
      create: {
        email: normalizedEmail,
        balance: safeAmount
      }
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "credit",
        amount: safeAmount,
        description,
        orderId
      }
    });
  });
}

export async function debitWallet(
  email: string,
  amount: number,
  description: string,
  orderId?: string
): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);
  const safeAmount = Math.max(0, Math.round(amount));
  if (safeAmount <= 0) return false;

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.userWallet.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, balance: true }
    });

    if (!wallet || wallet.balance < safeAmount) return false;

    await tx.userWallet.update({
      where: { email: normalizedEmail },
      data: { balance: { decrement: safeAmount } }
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "debit",
        amount: safeAmount,
        description,
        orderId
      }
    });

    return true;
  });
}

export async function reserveWalletBalance(email: string, amount: number, orderId: string) {
  const normalizedEmail = normalizeEmail(email);
  const safeAmount = Math.max(0, Math.round(amount));
  if (safeAmount <= 0) return { reserved: 0 };

  await releaseExpiredWalletReservations(normalizedEmail).catch(() => null);

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.userWallet.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, balance: true }
    });

    if (!wallet || wallet.balance < safeAmount) {
      throw new Error("رصيد المحفظة غير كافٍ. حدّث الصفحة وحاول مرة أخرى.");
    }

    const updated = await tx.userWallet.updateMany({
      where: { email: normalizedEmail, balance: { gte: safeAmount } },
      data: { balance: { decrement: safeAmount } }
    });
    if (updated.count !== 1) throw new Error("تعذر حجز رصيد المحفظة. حاول مرة أخرى.");

    await tx.walletReservation.create({
      data: {
        email: normalizedEmail,
        orderId,
        amount: safeAmount,
        status: "reserved",
        expiresAt: new Date(Date.now() + WALLET_RESERVATION_TTL_MS)
      }
    });

    return { reserved: safeAmount };
  });
}

export async function releaseWalletReservation(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const reservation = await tx.walletReservation.findUnique({ where: { orderId } });
    if (!reservation || reservation.status !== "reserved") return;

    await tx.walletReservation.update({ where: { orderId }, data: { status: "released" } });
    await tx.userWallet.upsert({
      where: { email: reservation.email },
      update: { balance: { increment: reservation.amount } },
      create: { email: reservation.email, balance: reservation.amount }
    });
  });
}

export async function captureWalletReservation(orderId: string, description: string) {
  await prisma.$transaction(async (tx) => {
    const reservation = await tx.walletReservation.findUnique({ where: { orderId } });
    if (!reservation || reservation.status === "captured") return;
    if (reservation.status !== "reserved") throw new Error("حجز المحفظة غير صالح لهذا الطلب");

    const wallet = await tx.userWallet.upsert({
      where: { email: reservation.email },
      update: {},
      create: { email: reservation.email, balance: 0 }
    });

    const existingDebit = await tx.walletTransaction.findFirst({ where: { orderId, type: "debit" } });
    if (!existingDebit) {
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "debit",
          amount: reservation.amount,
          description,
          orderId
        }
      });
    }

    await tx.walletReservation.update({ where: { orderId }, data: { status: "captured" } });
  });
}

export async function validateVoucher(
  code: string,
  email: string
): Promise<{ valid: boolean; voucher?: GiftVoucher; error?: string }> {
  const normalizedCode = normalizeVoucherCode(code);
  if (!normalizedCode || !email) {
    return { valid: false, error: "القسيمة أو البريد الإلكتروني غير مُقدَّم" };
  }

  const normalizedEmail = normalizeEmail(email);

  const voucher = await prisma.giftVoucher.findUnique({
    where: { code: normalizedCode }
  });

  if (!voucher) {
    return { valid: false, error: "القسيمة غير موجودة" };
  }

  if (!voucher.isActive) {
    return { valid: false, error: "القسيمة غير مفعلة" };
  }

  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    return { valid: false, error: "القسيمة منتهية الصلاحية" };
  }

  if (voucher.usedCount >= voucher.maxUses) {
    return { valid: false, error: "القسيمة مستخدمة بالكامل" };
  }

  const existingUsage = await prisma.voucherUsage.findFirst({
    where: { voucherId: voucher.id, email: normalizedEmail }
  });

  if (existingUsage) {
    return { valid: false, error: "هذه القسيمة مرتبطة بهذا البريد مسبقاً" };
  }

  return {
    valid: true,
    voucher: {
      code: voucher.code,
      amount: voucher.amount,
      maxUses: voucher.maxUses,
      usedCount: voucher.usedCount,
      expiresAt: voucher.expiresAt?.toISOString() ?? null,
      isActive: voucher.isActive
    }
  };
}

export async function applyVoucher(
  code: string,
  email: string,
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedCode = normalizeVoucherCode(code);
  const normalizedEmail = normalizeEmail(email);

  try {
    await prisma.$transaction(async (tx) => {
      const voucher = await tx.giftVoucher.findUnique({ where: { code: normalizedCode } });
      if (!voucher || !voucher.isActive) throw new Error("القسيمة غير صالحة");
      if (voucher.expiresAt && voucher.expiresAt < new Date()) throw new Error("القسيمة منتهية الصلاحية");
      if (voucher.usedCount >= voucher.maxUses) throw new Error("القسيمة مستخدمة بالكامل");

      const existingForOrder = await tx.voucherUsage.findFirst({ where: { orderId } });
      if (existingForOrder) return;

      const existingForEmail = await tx.voucherUsage.findFirst({
        where: { voucherId: voucher.id, email: normalizedEmail }
      });
      if (existingForEmail) throw new Error("هذه القسيمة مرتبطة بهذا البريد مسبقاً");

      await tx.voucherUsage.create({ data: { voucherId: voucher.id, email: normalizedEmail, orderId } });
      await tx.giftVoucher.update({ where: { code: normalizedCode }, data: { usedCount: { increment: 1 } } });
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "تعذر تطبيق القسيمة" };
  }
}
