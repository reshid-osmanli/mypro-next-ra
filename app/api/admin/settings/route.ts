import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminRequest } from "@/lib/admin-auth";
import { getSiteSettings, saveSiteSettings, siteSettingDefaults } from "@/lib/site-settings";
import { hexColorSchema } from "@/lib/security-validation";

const safeHrefSchema = z.string().trim().min(1).max(300).refine((value) => value.startsWith("/") && !value.startsWith("//"), "الرابط يجب أن يبدأ بـ /");
const optionalVisualUrlSchema = z.string().trim().max(500).refine((value) => {
  if (!value) return true;
  if (value.startsWith("/uploads/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}, "الرابط يجب أن يكون https أو /uploads");

const settingsSchema = z.object({
  brandName: z.string().trim().min(1).max(120),
  supportEmail: z.string().trim().email().max(120),
  supportPhone: z.string().trim().min(1).max(80),
  whatsapp: z.string().trim().min(1).max(80),
  heroEyebrow: z.string().trim().min(1).max(120),
  heroTitle: z.string().trim().min(1).max(180),
  heroDescription: z.string().trim().min(1).max(500),
  heroPrimaryCtaLabel: z.string().trim().min(1).max(80),
  heroPrimaryCtaHref: safeHrefSchema,
  heroSecondaryCtaLabel: z.string().trim().min(1).max(80),
  heroSecondaryCtaHref: safeHrefSchema,
  checkoutNote: z.string().trim().min(1).max(300),
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  logoUrl: optionalVisualUrlSchema.optional().nullable(),
  announcementEnabled: z.enum(["true", "false"]),
  announcementText: z.string().trim().max(180),
  announcementHref: safeHrefSchema,
  promoTitle: z.string().trim().max(160),
  promoDescription: z.string().trim().max(420),
  promoImageUrl: optionalVisualUrlSchema,
  promoCtaLabel: z.string().trim().max(80),
  promoCtaHref: safeHrefSchema,
  homepageProductLimit: z.string().trim().regex(/^\d{1,2}$/),
  homepageProductOrder: z.enum(["featured", "newest", "manual"])
});

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;
  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;
  const body = await req.json().catch(() => null);
  const parsed = settingsSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });

  const settings = await saveSiteSettings({ ...siteSettingDefaults, ...parsed.data });
  return NextResponse.json({ settings });
}
