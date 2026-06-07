import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const id = params.id;
  let body: { isActive?: boolean } | undefined;

  try {
    body = await req.json().catch(() => undefined);
  } catch {
    return NextResponse.json({ error: "تعذر قراءة بيانات الطلب" }, { status: 400 });
  }

  const voucher = await prisma.giftVoucher.findUnique({ where: { id } });
  if (!voucher) {
    return NextResponse.json({ error: "القسيمة غير موجودة" }, { status: 404 });
  }

  const updated = await prisma.giftVoucher.update({
    where: { id },
    data: {
      isActive: body?.isActive ?? voucher.isActive
    }
  });

  return NextResponse.json({
    message: updated.isActive ? "تم تفعيل القسيمة" : "تم إلغاء تفعيل القسيمة"
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const id = params.id;

  const voucher = await prisma.giftVoucher.findUnique({ where: { id } });
  if (!voucher) {
    return NextResponse.json({ error: "القسيمة غير موجودة" }, { status: 404 });
  }

  if (voucher.usedCount > 0) {
    return NextResponse.json({ error: "لا يمكن حذف القسيمة بعد استخدامها" }, { status: 400 });
  }

  await prisma.giftVoucher.delete({ where: { id } });

  return NextResponse.json({ message: "تم حذف القسيمة" });
}