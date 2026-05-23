import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { SiteShell } from "@/components/site-shell";
import { SitePreferenceProvider } from "@/components/site-preferences";
import { getSiteSettings } from "@/lib/site-settings";

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
  const settings = await getSiteSettings();

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <SitePreferenceProvider>
          <CartProvider>
            <SiteShell brandName={settings.brandName}>{children}</SiteShell>
          </CartProvider>
        </SitePreferenceProvider>
      </body>
    </html>
  );
}
