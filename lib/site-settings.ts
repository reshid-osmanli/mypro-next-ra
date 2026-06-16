import { prisma } from "./db";

export type SiteSettings = {
  brandName: string;
  supportEmail: string;
  supportPhone: string;
  whatsapp: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaHref: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaHref: string;
  checkoutNote: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  announcementEnabled: string;
  announcementText: string;
  announcementHref: string;
  promoTitle: string;
  promoDescription: string;
  promoImageUrl: string;
  promoImageScale: string;
  promoImagePosition: string;
  promoImageRotation: string;
  promoMotionEnabled: string;
  promoCtaLabel: string;
  promoCtaHref: string;
  homepageProductLimit: string;
  homepageProductOrder: string;
};

export const siteSettingDefaults: SiteSettings = {
  brandName: "موقع كُتبي",
  supportEmail: "support@kutubi.qa",
  supportPhone: "+974 0000 0000",
  whatsapp: "+974 0000 0000",
  heroEyebrow: "منصة تعليمية عربية",
  heroTitle: "متجر رقمي احترافي لبيع عروض البوربوينت وأوراق العمل",
  heroDescription:
    "واجهة عربية أنيقة مع متجر واضح، مكتبة مرتبة حسب الصف والمادة، ولوحة إدارة آمنة لإضافة المنتجات والملفات والأسعار وصور الأغلفة.",
  heroPrimaryCtaLabel: "تصفح المنتجات",
  heroPrimaryCtaHref: "/products",
  heroSecondaryCtaLabel: "عرض المكتبة",
  heroSecondaryCtaHref: "/library",
  checkoutNote: "الملفات الرقمية تُسلّم مباشرة بعد الدفع عبر روابط تحميل مؤقتة وآمنة.",
  primaryColor: "#8a1538",
  secondaryColor: "#0f766e",
  logoUrl: null,
  announcementEnabled: "true",
  announcementText: "عروض رقمية جاهزة للتدريس مع دفع آمن وتحميل فوري.",
  announcementHref: "/products",
  promoTitle: "رتّب واجهة موقعك من لوحة التحكم",
  promoDescription: "غيّر الشعار، البنر، العروض، ترتيب المنتجات، وصور الحملة بدون تعديل الكود.",
  promoImageUrl: "",
  promoImageScale: "1",
  promoImagePosition: "center",
  promoImageRotation: "0",
  promoMotionEnabled: "false",
  promoCtaLabel: "اكتشف العروض",
  promoCtaHref: "/products",
  homepageProductLimit: "4",
  homepageProductOrder: "featured"
};

function normalizeSettings(rows: { key: string; value: string }[]): SiteSettings {
  return {
    ...siteSettingDefaults,
    ...Object.fromEntries(rows.map((row) => [row.key, row.value]))
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await prisma.siteSetting.findMany();
    return normalizeSettings(rows);
  } catch (error) {
    console.warn("[site-settings] Database unavailable; using defaults", error);
    return siteSettingDefaults;
  }
}

export async function saveSiteSettings(input: Partial<SiteSettings>) {
  const allowedKeys = new Set(Object.keys(siteSettingDefaults));
  const entries = Object.entries(input)
    .filter(([key]) => allowedKeys.has(key))
    .map(([key, value]) => [key, String(value ?? "")] as [string, string]);

  try {
    await Promise.all(
      entries.map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      )
    );
    return getSiteSettings();
  } catch (error) {
    console.warn("[site-settings] Database unavailable; settings were not saved", error);
    throw new Error("تعذر حفظ الإعدادات لأن قاعدة البيانات غير متصلة. تحقق من DATABASE_URL في Vercel ثم أعد النشر.");
  }
}
