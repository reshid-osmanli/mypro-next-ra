import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";
import { isKnownPrivateUploadMimeType, isSafePrivateStoredUploadUrl } from "@/lib/upload-policy";
import { coverImageSchema, hexColorSchema, moneyAmountSchema, normalizeOptionalStoredUrl, storedFileSizeSchema } from "@/lib/security-validation";
import { reportCaughtError, routeContext } from "@/lib/report-caught-error";

const fileSchema = z.object({
  title: z.string().trim().min(1).max(120),
  url: z.string().trim().min(1).max(500).refine(isSafePrivateStoredUploadUrl, "رابط الملف يجب أن يكون من التخزين الخاص"),
  mimeType: z.string().trim().min(1).max(120).refine(isKnownPrivateUploadMimeType, "نوع الملف غير مسموح كمرفق مدفوع"),
  size: storedFileSizeSchema
});

const createSchema = z.object({
  title: z.string().trim().min(2).max(120),
  excerpt: z.string().trim().min(2).max(240),
  description: z.string().trim().min(10).max(10000),
  price: moneyAmountSchema,
  compareAt: z.coerce.number().nonnegative().nullable().optional(),
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

function getErrorCode(error: unknown) {
  return typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : null;
}

function logProductError(action: string, error: unknown, context?: Record<string, unknown>) {
  console.error(`[admin/products:${action}]`, context ?? {}, error);
}

async function createUniqueSlug(input: string) {
  const base = slugify(input) || `product-${Date.now()}`;
  let slug = base;

  for (let index = 2; index <= 30; index += 1) {
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
    slug = `${base}-${index}`;
  }

  return `${base}-${Date.now()}`;
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    logProductError("create:read-body", error);
    return NextResponse.json({ error: "تعذر قراءة بيانات المنتج" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.flatten();
    logProductError("create:validation", details);
    return NextResponse.json({ error: "البيانات غير صالحة. تحقق من الحقول المطلوبة وصورة الغلاف والمرفقات.", details: details.fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const coverImage = normalizeOptionalStoredUrl(data.coverImage ?? data.imageUrl);
  const slug = await createUniqueSlug(data.slug || data.title);

  try {
    const product = await prisma.product.create({
      data: {
        slug,
        title: data.title,
        excerpt: data.excerpt,
        description: data.description,
        price: data.price,
        compareAt: data.compareAt && data.compareAt > 0 ? data.compareAt : null,
        badge: data.badge,
        grade: data.grade,
        subject: data.subject,
        category: data.category,
        format: data.format,
        pages: data.pages,
        level: data.level,
        featured: data.featured ?? false,
        status: data.status ?? "published",
        accentA: data.accentA ?? "#8a1538",
        accentB: data.accentB ?? "#5f1029",
        coverImage,
        sortOrder: data.sortOrder ?? 0,
        ...(data.files.length
          ? {
              files: {
                create: data.files.map((file) => ({
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

    return NextResponse.json({ product, imageUrl: product.coverImage }, { status: 201 });
  } catch (error) {
    logProductError("create:prisma", error, { slug, title: data.title });
    const code = getErrorCode(error);
    if (code === "P2002") {
      return NextResponse.json({ error: "يوجد منتج بنفس الرابط المختصر. غيّر العنوان أو حاول مرة أخرى." }, { status: 409 });
    }
    await reportCaughtError(error, { ...routeContext(req, "admin"), statusCode: 500 });
    return NextResponse.json({ error: "تعذر حفظ المنتج في قاعدة البيانات. راجع سجل الخادم لمعرفة السبب." }, { status: 500 });
  }
}
