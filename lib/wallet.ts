import { prisma } from "./db";
import type { GiftVoucher, UserWallet, WalletTransactionType } from "./types";

export async function getOrCreateWallet(email: string): Promise<UserWallet> {
  const normalizedEmail = email.trim().toLowerCase();

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
  const normalizedEmail = email.trim().toLowerCase();

  await prisma.$transaction(async (tx) => {
    const wallet = await tx.userWallet.upsert({
      where: { email: normalizedEmail },
      update: { balance: { increment: amount } },
      create: {
        email: normalizedEmail,
        balance: amount
      }
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "credit",
        amount,
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
  const normalizedEmail = email.trim().toLowerCase();

  const result = await prisma.userWallet.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, balance: true }
  });

  if (!result || result.balance < amount) return false;

  await prisma.$transaction(async (tx) => {
    await tx.userWallet.update({
      where: { email: normalizedEmail },
      data: {
        balance: { decrement: amount }
      }
    });

    await tx.walletTransaction.create({
      data: {
        walletId: result.id,
        type: "debit",
        amount,
        description,
        orderId
      }
    });
  });

  return true;
}

export async function validateVoucher(
  code: string,
  email: string
): Promise<{ valid: boolean; voucher?: GiftVoucher; error?: string }> {
  if (!code || !email) {
    return { valid: false, error: "القسيمة أو البريد الإلكتروني غير مُقدَّم" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const voucher = await prisma.giftVoucher.findUnique({
    where: { code }
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
  const normalizedEmail = email.trim().toLowerCase();

  const voucher = await prisma.giftVoucher.findUnique({
    where: { code }
  });

  if (!voucher || !voucher.isActive) {
    return { success: false, error: "القسيمة غير صالحة" };
  }

  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    return { success: false, error: "القسيمة منتهية الصلاحية" };
  }

  if (voucher.usedCount >= voucher.maxUses) {
    return { success: false, error: "القسيمة مستخدمة بالكامل" };
  }

  const existingUsage = await prisma.voucherUsage.findFirst({
    where: { voucherId: voucher.id, email: normalizedEmail }
  });

  if (existingUsage) {
    return { success: false, error: "هذه القسيمة مرتبطة بهذا البريد مسبقاً" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.voucherUsage.create({
      data: { voucherId: voucher.id, email: normalizedEmail, orderId }
    });
    await tx.giftVoucher.update({
      where: { code },
      data: { usedCount: { increment: 1 } }
    });
  });

  return { success: true };
}