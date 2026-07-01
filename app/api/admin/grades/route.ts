import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  sortOrder: z.coerce.number().int().min(0).optional()
});

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });

  const grade = await prisma.grade.create({ data: { name: parsed.data.name, sortOrder: parsed.data.sortOrder ?? 0 } });
  return NextResponse.json({ grade });
}
