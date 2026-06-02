import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";
import { isKnownPrivateUploadMimeType, isSafePrivateStoredUploadUrl } from "@/lib/upload-policy";
import { coverImageSchema, hexColorSchema, moneyAmountSchema, normalizeOptionalStoredUrl, storedFileSizeSchema } from "@/lib/security-validation";

type RouteContext = { params: Promise<{ id: string }> };

const fileSchema = z.object({
  title: z.string().trim().min(1).max(120),
  url: z.string().trim().min(1).max(500).refine(isSafePrivateStoredUploadUrl, "رابط الملف يجب أن يكون من التخزين الخاص"),
  mimeType: z.string().trim().min(1).max(120).refine(isKnownPrivateUploadMimeType, "نوع الملف غير مسموح كمرفق مدفوع"),
  size: storedFileSizeSchema
});

const baseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  excerpt: z.string().trim().min(2).max(240),
  description: z.string().trim().min(10).max(10000),
  price: moneyAmountSchema,
  compareAt: moneyAmountSchema.optional(),
  badge: z.string().trim().min(1).max(50),
  grade: z.string().trim().min(1).max(80),
  subject: z.string().trim().min(1).max(80),
  category: z.string().trim().min(1).max(80),
  format: z.string().trim().min(1).max(80),
  pages: z.string().trim().min(1).max(80),
  level: z.string().trim().min(1).max(80),
  featured: z.boolean().optional(),
  status: z.string().trim().min(1).max(40).optional(),
  accentA: hexColorSchema.optional(),
  accentB: hexColorSchema.optional(),
  coverImage: coverImageSchema,
  imageUrl: coverImageSchema,
  slug: z.string().trim().max(150).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  files: z.array(fileSchema).default([])
});

const patchSchema = baseSchema.partial().extend({
  compareAt: z.coerce.number().nonnegative().nullable().optional(),
  files: z.array(fileSchema).optional()
});

function getErrorCode(error: unknown) {
  return typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : null;
}

function logProductError(action: string, error: unknown, context?: Record<string, unknown>) {
  console.error(`[admin/products:${action}]`, context ?? {}, error);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json().catch((error) => {
    logProductError("update:read-body", error, { id });
    return null;
  });
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.flatten();
    logProductError("update:validation", details, { id });
    return NextResponse.json({ error: "البيانات غير صالحة. تحقق من الحقول المطلوبة وصورة الغلاف والمرفقات.", details: details.fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const { files, compareAt, coverImage, imageUrl, ...rest } = data;

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(typeof coverImage === "string" || typeof imageUrl === "string" ? { coverImage: normalizeOptionalStoredUrl(coverImage ?? imageUrl) } : {}),
        ...(typeof compareAt !== "undefined" ? { compareAt: compareAt && compareAt > 0 ? compareAt : null } : {}),
        ...(files?.length
          ? {
              files: {
                create: files.map((file) => ({
                  title: file.title,
                  url: file.url,
                  mimeType: file.mimeType,
                  size: file.size
                }))
              }
            }
          : {})
      },
      include: { files: true }
    });

    return NextResponse.json({ product, imageUrl: product.coverImage });
  } catch (error) {
    logProductError("update:prisma", error, { id });
    if (getErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ error: "تعذر تحديث المنتج في قاعدة البيانات. راجع سجل الخادم لمعرفة السبب." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logProductError("delete:prisma", error, { id });
    if (getErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ error: "تعذر حذف المنتج من قاعدة البيانات. راجع سجل الخادم لمعرفة السبب." }, { status: 500 });
  }
}
