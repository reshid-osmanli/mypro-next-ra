import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";
import { motionLogoSchema, normalizeOptionalStoredUrl } from "@/lib/security-validation";

type RouteContext = { params: Promise<{ id: string }> };

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  motionLogo: motionLogoSchema,
  sortOrder: z.coerce.number().int().min(0).optional()
});

export async function POST(req: NextRequest, { params }: RouteContext) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });

  const subject = await prisma.subject.create({
    data: {
      gradeId: id,
      name: parsed.data.name,
      motionLogo: normalizeOptionalStoredUrl(parsed.data.motionLogo),
      sortOrder: parsed.data.sortOrder ?? 0
    }
  });
  return NextResponse.json({ subject });
}
