import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";

type RouteContext = { params: Promise<{ id: string }> };

const schema = z.object({
  grade: z.string().trim().min(1).max(80),
  subject: z.string().trim().min(1).max(80),
  title: z.string().trim().min(2).max(120),
  intro: z.string().trim().min(2).max(300),
  body: z.string().trim().min(2).max(10000),
  heroLabel: z.string().trim().min(1).max(80),
  published: z.boolean().optional()
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });

  const page = await prisma.contentPage.update({
    where: { id },
    data: {
      slug: slugify(`${parsed.data.grade}-${parsed.data.subject}`),
      grade: parsed.data.grade,
      subject: parsed.data.subject,
      title: parsed.data.title,
      intro: parsed.data.intro,
      body: parsed.data.body,
      heroLabel: parsed.data.heroLabel,
      published: parsed.data.published ?? true
    }
  });
  return NextResponse.json({ page });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id } = await params;
  await prisma.contentPage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
