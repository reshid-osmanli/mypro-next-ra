import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";

type RouteContext = { params: Promise<{ id: string }> };

const schema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  sortOrder: z.coerce.number().int().min(0).optional()
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });

  const current = await prisma.grade.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "الصف غير موجود" }, { status: 404 });

  const grade = await prisma.grade.update({
    where: { id },
    data: {
      ...(typeof parsed.data.name === "string" ? { name: parsed.data.name } : {}),
      ...(typeof parsed.data.sortOrder === "number" ? { sortOrder: parsed.data.sortOrder } : {})
    }
  });

  if (typeof parsed.data.name === "string" && parsed.data.name !== current.name) {
    await prisma.product.updateMany({ where: { grade: current.name }, data: { grade: parsed.data.name } });
    await prisma.contentPage.updateMany({ where: { grade: current.name }, data: { grade: parsed.data.name } });
  }

  return NextResponse.json({ grade });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id } = await params;
  const grade = await prisma.grade.findUnique({ where: { id }, include: { subjects: true } });
  if (!grade) return NextResponse.json({ error: "الصف غير موجود" }, { status: 404 });

  const relatedProducts = await prisma.product.count({ where: { grade: grade.name } });
  const relatedPages = await prisma.contentPage.count({ where: { grade: grade.name } });
  if (relatedProducts || relatedPages) {
    return NextResponse.json({ error: "لا يمكن حذف الصف لأنه مرتبط بمنتجات أو صفحات. انقل المحتوى أولاً." }, { status: 409 });
  }

  await prisma.grade.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
