import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";
import { motionLogoSchema, normalizeOptionalStoredUrl } from "@/lib/security-validation";

type RouteContext = { params: Promise<{ id: string }> };

const schema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  motionLogo: motionLogoSchema,
  sortOrder: z.coerce.number().int().min(0).optional()
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });

  const current = await prisma.subject.findUnique({ where: { id }, include: { grade: true } });
  if (!current) return NextResponse.json({ error: "المادة غير موجودة" }, { status: 404 });

  const subject = await prisma.subject.update({
    where: { id },
    data: {
      ...(typeof parsed.data.name === "string" ? { name: parsed.data.name } : {}),
      ...(typeof parsed.data.motionLogo === "string" ? { motionLogo: normalizeOptionalStoredUrl(parsed.data.motionLogo) } : {}),
      ...(typeof parsed.data.sortOrder === "number" ? { sortOrder: parsed.data.sortOrder } : {})
    }
  });

  if (typeof parsed.data.name === "string" && parsed.data.name !== current.name) {
    await prisma.product.updateMany({ where: { grade: current.grade.name, subject: current.name }, data: { subject: parsed.data.name } });
    await prisma.contentPage.updateMany({ where: { grade: current.grade.name, subject: current.name }, data: { subject: parsed.data.name } });
  }

  return NextResponse.json({ subject });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id } = await params;
  const subject = await prisma.subject.findUnique({ where: { id }, include: { grade: true } });
  if (!subject) return NextResponse.json({ error: "المادة غير موجودة" }, { status: 404 });

  const relatedProducts = await prisma.product.count({ where: { grade: subject.grade.name, subject: subject.name } });
  const relatedPages = await prisma.contentPage.count({ where: { grade: subject.grade.name, subject: subject.name } });
  if (relatedProducts || relatedPages) {
    return NextResponse.json({ error: "لا يمكن حذف المادة لأنها مرتبطة بمحتوى. انقل المحتوى أولاً." }, { status: 409 });
  }

  await prisma.subject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
