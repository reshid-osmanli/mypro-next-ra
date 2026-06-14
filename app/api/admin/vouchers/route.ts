import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

const createSchema = z.object({
  code: z.string().trim().min(1).optional(),
  amount: z.number().int().min(1),
  maxUses: z.number().int().min(1).default(1),
  expiresAt: z.string().datetime().optional()
});

export async function GET(_req: NextRequest) {
  const authError = await requireAdminRequest(_req);
  if (authError) return authError;

  const vouchers = await prisma.giftVoucher.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return NextResponse.json({
    vouchers: vouchers.map((v) => ({
      id: v.id,
      code: v.code,
      amount: v.amount,
      maxUses: v.maxUses,
      usedCount: v.usedCount,
      expiresAt: v.expiresAt?.toISOString() ?? null,
      isActive: v.isActive,
      createdAt: v.createdAt.toISOString()
    }))
  });
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "تعذر قراءة بيانات الطلب" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });
  }

  const code = (parsed.data.code || generateVoucherCode()).trim().toUpperCase().replace(/\s+/g, "");
  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;

  const existing = await prisma.giftVoucher.findUnique({
    where: { code }
  });

  if (existing) {
    return NextResponse.json({ error: "القسيمة موجودة مسبقاً" }, { status: 400 });
  }

  const voucher = await prisma.giftVoucher.create({
    data: {
      code,
      amount: parsed.data.amount,
      maxUses: parsed.data.maxUses,
      expiresAt
    }
  });

  return NextResponse.json({ voucher: { code: voucher.code, amount: voucher.amount, maxUses: voucher.maxUses } });
}

function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "KTB-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}