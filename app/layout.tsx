import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Cairo } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { SiteShell } from "@/components/site-shell";
import { SitePreferenceProvider } from "@/components/site-preferences";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { getSiteSettings } from "@/lib/site-settings";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900", "1000"],
  variable: "--font-cairo",
  display: "swap"
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
    <html lang={locale === "en" ? "en" : "ar"} dir={locale === "en" ? "ltr" : "rtl"} suppressHydrationWarning>
      <body className={`${cairo.variable} min-h-screen antialiased font-cairo`}>
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
