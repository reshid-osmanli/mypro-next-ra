import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminRequest } from "@/lib/admin-auth";
import { getSiteSettings, saveSiteSettings, siteSettingDefaults } from "@/lib/site-settings";
import { hexColorSchema } from "@/lib/security-validation";

const settingsSchema = z.object({
  brandName: z.string().trim().min(1).max(120),
  supportEmail: z.string().trim().min(1).max(120),
  supportPhone: z.string().trim().min(1).max(80),
  whatsapp: z.string().trim().min(1).max(80),
  heroEyebrow: z.string().trim().min(1).max(120),
  heroTitle: z.string().trim().min(1).max(180),
  heroDescription: z.string().trim().min(1).max(500),
  checkoutNote: z.string().trim().min(1).max(300),
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema
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
