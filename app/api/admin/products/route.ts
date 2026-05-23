import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";
import { isKnownPrivateUploadMimeType, isSafePrivateStoredUploadUrl } from "@/lib/upload-policy";
import { coverImageSchema, hexColorSchema, moneyAmountSchema, normalizeOptionalStoredUrl, storedFileSizeSchema } from "@/lib/security-validation";

const fileSchema = z.object({
  title: z.string().trim().min(1).max(120),
  url: z.string().trim().min(1).max(500).refine(isSafePrivateStoredUploadUrl, "رابط الملف يجب أن يكون من التخزين الخاص"),
  mimeType: z.string().trim().min(1).max(120).refine(isKnownPrivateUploadMimeType, "نوع الملف غير مسموح كمرفق مدفوع"),
  size: storedFileSizeSchema
});

const schema = z.object({
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
  slug: z.string().trim().max(150).optional(),
  files: z.array(fileSchema).default([])
});

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });

  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(`${data.grade}-${data.subject}-${data.title}`);

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
      accentB: data.accentB ?? "#0f766e",
      coverImage: normalizeOptionalStoredUrl(data.coverImage),
      files: {
        create: data.files.map((file) => ({
          title: file.title,
          url: file.url,
          mimeType: file.mimeType,
          size: file.size
        }))
      }
    },
    include: { files: true }
  });

  return NextResponse.json({ product });
}
