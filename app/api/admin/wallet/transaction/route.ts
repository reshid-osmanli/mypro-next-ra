import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

const transactionSchema = z.object({
  emails: z.array(z.string().email()).min(1),
  amount: z.number().int().min(1),
  description: z.string().min(1),
  type: z.enum(["credit", "debit"])
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

  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });
  }

  const { emails, amount, description, type } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      for (const email of emails) {
        const normalizedEmail = email.trim().toLowerCase();

        if (type === "debit") {
          const existingWallet = await tx.userWallet.findUnique({
            where: { email: normalizedEmail }
          });
          
          if (!existingWallet || existingWallet.balance < amount) {
            throw new Error(`رصيد محفظة ${normalizedEmail} غير كافٍ لخصم ${amount}`);
          }
          
          const wallet = await tx.userWallet.update({
            where: { email: normalizedEmail },
            data: { balance: { decrement: amount } }
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "debit",
              amount,
              description: description
            }
          });
        } else {
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
              description: description
            }
          });
        }
      }
    });

    const actionText = type === "credit" ? "إضافة" : "خصم";
    return NextResponse.json({
      message: `تم ${actionText} ${amount} بنجاح لـ ${emails.length} عميل`,
      count: emails.length
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "حدث خطأ أثناء معالجة المحفظة" 
    }, { status: 400 });
  }
}
