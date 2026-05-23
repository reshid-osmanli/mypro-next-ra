import { prisma } from "./db";

export type SiteSettings = {
  brandName: string;
  supportEmail: string;
  supportPhone: string;
  whatsapp: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  checkoutNote: string;
  primaryColor: string;
  secondaryColor: string;
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
  checkoutNote: "الملفات الرقمية تُسلّم مباشرة بعد الدفع عبر روابط تحميل مؤقتة وآمنة.",
  primaryColor: "#8a1538",
  secondaryColor: "#0f766e"
};

function normalizeSettings(rows: { key: string; value: string }[]): SiteSettings {
  return {
    ...siteSettingDefaults,
    ...Object.fromEntries(rows.map((row) => [row.key, row.value]))
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await prisma.siteSetting.findMany();
  return normalizeSettings(rows);
}

export async function saveSiteSettings(input: Partial<SiteSettings>) {
  const entries = Object.entries(input).filter(([, value]) => typeof value === "string");
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
}
