// ============================================================================
// i18n.ts — next-intl config
// ----------------------------------------------------------------------------
// New file (root): /i18n.ts
// ============================================================================

import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

export const locales = ["ar", "en"] as const;
export const defaultLocale = "ar" as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();

  const messages = (await import(`./messages/${locale}.json`)).default;
  return {
    locale,
    messages,
    timeZone: "Asia/Riyadh",
    now: new Date(),
    formats: {
      dateTime: {
        short: { day: "numeric", month: "short", year: "numeric" },
        medium: { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" },
        long: { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" },
      },
    },
  };
});
