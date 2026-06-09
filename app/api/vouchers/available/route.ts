import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  const vouchers = await prisma.giftVoucher.findMany({
    where: {
      isActive: true,
      usedCount: { lt: prisma.giftVoucher.fields.maxUses }
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  const now = new Date();
  const validVouchers = vouchers
    .filter((v) => !v.expiresAt || v.expiresAt > now)
    .map((v) => ({
      code: v.code,
      amount: v.amount
    }));

  return NextResponse.json({ vouchers: validVouchers });
}