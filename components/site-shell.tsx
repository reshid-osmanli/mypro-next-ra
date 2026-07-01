"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

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
    <div className="min-h-screen overflow-hidden text-zinc-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#fffdf8] dark:bg-[#0c1018]" />
      <div className="site-motion-backdrop" aria-hidden="true">
        <span className="site-motion-trace site-motion-trace-a" />
        <span className="site-motion-trace site-motion-trace-b" />
        <span className="site-motion-panel site-motion-panel-a" />
        <span className="site-motion-panel site-motion-panel-b" />
      </div>
      <SiteHeader brandName={brandName} logoUrl={logoUrl} />
      <main className="relative">{children}</main>
      <SiteFooter />
    </div>
  );
}
