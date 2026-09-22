"use client";

import { Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useCart } from "@/components/cart-provider";
import { useSitePreferences } from "@/components/site-preferences";
import { SearchOverlay } from "@/components/store/search-overlay";
import { MobileMenu, MAIN_NAV } from "@/components/store/mobile-menu";
import { Wordmark } from "@/components/store/logo";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  brandName?: string;
  logoUrl?: string | null;
};

/**
 * KUTUBI header — clean, stable, scroll-aware.
 * Rest: h-16, transparent-ish paper. Scrolled: h-14 + soft shadow.
 * Search opens the overlay; cart opens the drawer; mobile gets a menu drawer.
 */
export function SiteHeader({ brandName = "كُتبي", logoUrl = null }: SiteHeaderProps) {
  const pathname = usePathname();
  const { text } = useSitePreferences();
  const { items, openDrawer } = useCart();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && Boolean(session?.user?.email);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const count = items.length;

  // rAF-throttled scroll state (passive)
  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        ticking = false;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cmd/Ctrl+K opens search
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-normal ease-standard",
        scrolled
          ? "border-line bg-paper/92 shadow-soft backdrop-blur-md"
          : "border-transparent bg-paper/80 backdrop-blur-sm"
      )}
    >
      {/* brand strip */}
      <div className="h-0.5 w-full bg-brand" aria-hidden="true" />

      <div className="container-wide">
        <div
          className={cn(
            "flex items-center justify-between gap-4 transition-[padding] duration-normal ease-standard",
            scrolled ? "py-2.5" : "py-3.5"
          )}
        >
          {/* brand */}
          <Link href="/" aria-label={brandName} className="shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brandName} className="h-9 w-9 rounded-sm object-cover" />
            ) : (
              <Wordmark name={brandName} />
            )}
          </Link>

          {/* desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="main">
            {MAIN_NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-sm px-3.5 py-2 text-body-sm font-semibold transition-colors duration-instant",
                    active ? "text-brand-deep" : "text-ink-soft hover:text-ink"
                  )}
                >
                  {text(item.label)}
                  {active ? (
                    <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-pill bg-brand" aria-hidden="true" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* actions */}
          <div className="flex items-center gap-1.5">
            {/* search */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 items-center gap-2 rounded-sm border border-line bg-surface px-3 text-body-sm font-medium text-ink-faint transition-colors duration-instant hover:border-line-strong hover:text-ink md:inline-flex"
              aria-label={text({ ar: "بحث", en: "Search" })}
            >
              <Search size={16} strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden xl:inline">{text({ ar: "بحث", en: "Search" })}</span>
              <kbd className="hidden rounded-sm border border-line bg-paper-deep/60 px-1.5 py-0.5 text-[10px] font-semibold text-ink-faint xl:inline">
                Ctrl K
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid size-10 place-items-center rounded-sm text-ink-soft transition-colors duration-instant hover:bg-paper-deep hover:text-ink md:hidden"
              aria-label={text({ ar: "بحث", en: "Search" })}
            >
              <Search size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>

            {/* cart */}
            <button
              type="button"
              onClick={openDrawer}
              className="relative grid size-10 place-items-center rounded-sm text-ink-soft transition-colors duration-instant hover:bg-paper-deep hover:text-ink"
              aria-label={text({ ar: `السلة (${count})`, en: `Cart (${count})` })}
            >
              <ShoppingBag size={19} strokeWidth={1.75} aria-hidden="true" />
              {count > 0 ? (
                <span className="tnum absolute -top-0.5 -end-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-pill bg-brand px-1 text-[10px] font-bold leading-none text-white">
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </button>

            {/* account */}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hidden h-10 items-center gap-2 rounded-sm border border-line bg-surface px-3 text-body-sm font-semibold text-ink-soft transition-colors duration-instant hover:border-line-strong hover:text-ink sm:inline-flex"
                title={text({ ar: "تسجيل الخروج", en: "Sign out" })}
              >
                <UserRound size={15} strokeWidth={1.75} className="text-brand" aria-hidden="true" />
                <span className="max-w-[110px] truncate">{session?.user?.name || session?.user?.email}</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="hidden h-10 items-center gap-2 rounded-sm border border-line bg-surface px-3 text-body-sm font-semibold text-ink-soft transition-colors duration-instant hover:border-line-strong hover:text-ink sm:inline-flex"
              >
                <UserRound size={15} strokeWidth={1.75} className="text-brand" aria-hidden="true" />
                <span>{text({ ar: "دخول", en: "Sign in" })}</span>
              </Link>
            )}

            {/* mobile menu */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid size-10 place-items-center rounded-sm text-ink-soft transition-colors duration-instant hover:bg-paper-deep hover:text-ink lg:hidden"
              aria-label={text({ ar: "القائمة", en: "Open menu" })}
            >
              <Menu size={19} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
