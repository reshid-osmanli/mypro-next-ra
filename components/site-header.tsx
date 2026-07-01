"use client";

import Link from "next/link";
import { HandCoins, Home, Languages, LibraryBig, LogIn, LogOut, Moon, Newspaper, ReceiptText, Search, ShieldCheck, Sun, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { CartButton } from "./cart-button";
import { useSitePreferences, type LocalizedTextValue } from "./site-preferences";
import { KutubiLogoMotion } from "./kutubi-logo-motion";

const navItems = [
  { href: "/", label: { ar: "الرئيسية", en: "Home" }, icon: Home },
  { href: "/products", label: { ar: "المتجر", en: "Store" }, icon: Search },
  { href: "/library", label: { ar: "المكتبة", en: "Library" }, icon: LibraryBig },
  { href: "/blog", label: { ar: "المدونة", en: "Blog" }, icon: Newspaper },
  { href: "/affiliates", label: { ar: "العمولة", en: "Affiliates" }, icon: HandCoins },
  { href: "/checkout", label: { ar: "الدفع", en: "Checkout" }, icon: ShieldCheck },
  { href: "/purchases", label: { ar: "مشترياتي", en: "Purchases" }, icon: ReceiptText }
];

type SiteHeaderProps = {
  brandName?: string;
  logoUrl?: string | null;
};

const copy: Record<string, LocalizedTextValue> = {
  subtitle: { ar: "متجر ملفات تعليمية رقمية", en: "Ready digital teaching files" },
  browse: { ar: "تصفح المنتجات", en: "Browse products" },
  login: { ar: "تسجيل الدخول", en: "Sign in" },
  logout: { ar: "تسجيل الخروج", en: "Sign out" },
  theme: { ar: "تبديل الوضع الليلي", en: "Toggle dark mode" },
  language: { ar: "تغيير اللغة", en: "Change language" }
};

export function SiteHeader({ brandName = "موقع كُتبي", logoUrl = null }: SiteHeaderProps) {
  const { language, theme, text, toggleLanguage, toggleTheme } = useSitePreferences();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && Boolean(session?.user?.email);

  return (
    <header className="sticky top-0 z-50 border-b border-pearl-200 bg-white/95 backdrop-blur-xl">
      <div className="h-1 bg-qatar-700" />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          {logoUrl ? (
            logoUrl.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
              <video
                src={logoUrl}
                className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-lg object-cover"
                muted
                loop
                playsInline
                autoPlay
              />
            ) : (
              <img src={logoUrl} alt="logo" className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-lg object-cover" />
            )
          ) : (
            <KutubiLogoMotion compact className="shrink-0" />
          )}
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-black text-zinc-950">{brandName}</div>
            <div className="hidden text-[11px] font-semibold text-zinc-500 sm:block">{text(copy.subtitle)}</div>
          </div>
        </Link>

        <nav className="hidden items-center justify-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-pearl-100 hover:text-qatar-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-qatar-100">
              <item.icon size={15} />
              {text(item.label)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <Link href="/products" className="btn-secondary hidden h-10 px-3 py-0 md:flex">
            <Search size={15} />
            {text(copy.browse)}
          </Link>
          {isAuthenticated ? (
            <div className="hidden h-10 max-w-[180px] items-center gap-2 rounded-md border border-pearl-200 bg-white px-3 text-sm font-bold text-zinc-700 sm:flex">
              <UserRound size={15} className="shrink-0 text-qatar-700" />
              <span className="truncate">{session?.user?.name || session?.user?.email}</span>
            </div>
          ) : null}
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-secondary h-10 w-10 px-0 py-0"
            aria-label={text(copy.theme)}
            title={text(copy.theme)}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            onClick={toggleLanguage}
            className="btn-secondary h-10 px-3 py-0"
            aria-label={text(copy.language)}
            title={text(copy.language)}
          >
            <Languages size={16} />
            <span className="text-xs font-black">{language === "ar" ? "EN" : "ع"}</span>
          </button>
          {isAuthenticated ? (
            <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary h-10 px-3 py-0" aria-label={text(copy.logout)} title={text(copy.logout)}>
              <LogOut size={16} />
              <span className="hidden text-xs font-black md:inline">{text(copy.logout)}</span>
            </button>
          ) : (
            <Link href="/login" className="btn-secondary h-10 px-4 py-0" aria-label={text(copy.login)}>
              <LogIn size={16} />
              <span className="hidden text-xs font-black md:inline">{text(copy.login)}</span>
            </Link>
          )}
          <CartButton />
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-1.5 border-t border-pearl-100 px-4 py-2 lg:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="inline-flex items-center justify-center gap-1.5 rounded-[10px] px-2.5 py-2 text-xs font-bold text-zinc-700 transition hover:bg-pearl-100 hover:text-qatar-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-qatar-100">
            <item.icon size={14} className="shrink-0" />
            <span>{text(item.label)}</span>
          </Link>
        ))}
      </div>
    </header>
  );
}
