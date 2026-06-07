import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

const creditSchema = z.object({
  emails: z.array(z.string().email()).min(1),
  amount: z.number().int().min(1),
  description: z.string().min(1),
  expiresAt: z.string().datetime().optional()
});

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "تعذر قراءة بيانات الطلب" }, { status: 400 });
  }

  const parsed = creditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });
  }

  const { emails, amount, description, expiresAt } = parsed.data;

  const descriptionWithExpiry = expiresAt
    ? `${description} (تنتهي: ${new Date(expiresAt).toLocaleDateString("ar-QA")})`
    : description;

  await prisma.$transaction(async (tx) => {
    for (const email of emails) {
      const normalizedEmail = email.trim().toLowerCase();

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
          description: descriptionWithExpiry
        }
      });
    }
  });

  return NextResponse.json({
    message: `تم إضافة ${amount} إلى محفظة ${emails.length} عميل`,
    creditedCount: emails.length
  });
}