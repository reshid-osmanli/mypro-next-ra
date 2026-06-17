import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";

const schema = z.object({
  grade: z.string().trim().min(1).max(80),
  subject: z.string().trim().min(1).max(80),
  title: z.string().trim().min(2).max(120),
  intro: z.string().trim().min(2).max(300),
  body: z.string().trim().min(2).max(10000),
  heroLabel: z.string().trim().min(1).max(80),
  published: z.boolean().optional()
});

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });

  const slug = slugify(`${parsed.data.grade}-${parsed.data.subject}`);
  const page = await prisma.contentPage.upsert({
    where: { slug },
    update: {
      grade: parsed.data.grade,
      subject: parsed.data.subject,
      title: parsed.data.title,
      intro: parsed.data.intro,
      body: parsed.data.body,
      heroLabel: parsed.data.heroLabel,
      published: parsed.data.published ?? true
    },
    create: {
      slug,
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
