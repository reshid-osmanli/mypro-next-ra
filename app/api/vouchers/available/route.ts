import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  const vouchers = await prisma.giftVoucher.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const usedVoucherIds = email
    ? new Set((await prisma.voucherUsage.findMany({ where: { email }, select: { voucherId: true } })).map((usage) => usage.voucherId))
    : new Set<string>();

  const now = new Date();
  const validVouchers = vouchers
    .filter((voucher) => voucher.usedCount < voucher.maxUses)
    .filter((voucher) => !voucher.expiresAt || voucher.expiresAt > now)
    .filter((voucher) => !usedVoucherIds.has(voucher.id))
    .slice(0, 20)
    .map((voucher) => ({
      code: voucher.code,
      amount: voucher.amount
    }));

  return NextResponse.json({ vouchers: validVouchers });
}
