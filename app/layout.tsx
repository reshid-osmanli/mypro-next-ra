import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { SiteShell } from "@/components/site-shell";
import { SitePreferenceProvider } from "@/components/site-preferences";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { getSiteSettings } from "@/lib/site-settings";

/*
 * KUTUBI type system — one family, four weights.
 * IBM Plex Sans Arabic (SIL OFL) covers Arabic + Latin + numerals,
 * so prices/metadata render in the same voice as the copy.
 * See docs/VISUAL_SYSTEM.md → Typography.
 */
const plexArabic = localFont({
  variable: "--font-plex",
  display: "swap",
  src: [
    {
      path: "../public/fonts/ibm-plex-sans-arabic-400.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../public/fonts/ibm-plex-sans-arabic-500.woff2",
      weight: "500",
      style: "normal"
    },
    {
      path: "../public/fonts/ibm-plex-sans-arabic-600.woff2",
      weight: "600",
      style: "normal"
    },
    {
      path: "../public/fonts/ibm-plex-sans-arabic-700.woff2",
      weight: "700",
      style: "normal"
    }
  ]
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.brandName,
    description: settings.heroDescription,
    icons: {
      icon: "/icon.svg",
      shortcut: "/icon.svg"
    }
  };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, locale, messages] = await Promise.all([
    getSiteSettings(),
    getLocale(),
    getMessages()
  ]);

  return (
    <html
      lang={locale === "en" ? "en" : "ar"}
      dir={locale === "en" ? "ltr" : "rtl"}
      suppressHydrationWarning
    >
      <body className={`min-h-screen font-sans antialiased ${plexArabic.variable}`}>
        <NextIntlClientProvider messages={messages}>
          <SitePreferenceProvider>
            <AuthSessionProvider>
              <CartProvider>
                <SiteShell brandName={settings.brandName} logoUrl={settings.logoUrl}>
                  {children}
                </SiteShell>
              </CartProvider>
            </AuthSessionProvider>
          </SitePreferenceProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
