"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { CartDrawer } from "./store/cart-drawer";

type SiteShellProps = {
  children: React.ReactNode;
  brandName?: string;
  logoUrl?: string | null;
};

export function SiteShell({ children, brandName, logoUrl }: SiteShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader brandName={brandName} logoUrl={logoUrl} />
      <main className="relative">{children}</main>
      <SiteFooter />
      <CartDrawer />
    </div>
  );
}
