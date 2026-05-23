"use client";

import Link from "next/link";
import { Home, Languages, LibraryBig, Moon, Search, ShieldCheck, Sun, UserRoundCog } from "lucide-react";
import { CartButton } from "./cart-button";
import { useSitePreferences, type LocalizedTextValue } from "./site-preferences";
import { KutubiLogoMotion } from "./kutubi-logo-motion";

const navItems = [
  { href: "/", label: { ar: "الرئيسية", en: "Home" }, icon: Home },
  { href: "/products", label: { ar: "المتجر", en: "Store" }, icon: Search },
  { href: "/library", label: { ar: "المكتبة", en: "Library" }, icon: LibraryBig },
  { href: "/checkout", label: { ar: "الدفع", en: "Checkout" }, icon: ShieldCheck }
];

type SiteHeaderProps = {
  brandName?: string;
};

const copy: Record<string, LocalizedTextValue> = {
  subtitle: { ar: "متجر ملفات تعليمية رقمية", en: "Ready digital teaching files" },
  browse: { ar: "تصفح المنتجات", en: "Browse products" },
  admin: { ar: "لوحة الإدارة", en: "Admin panel" },
  theme: { ar: "تبديل الوضع الليلي", en: "Toggle dark mode" },
  language: { ar: "تغيير اللغة", en: "Change language" }
};

export function SiteHeader({ brandName = "موقع كُتبي" }: SiteHeaderProps) {
  const { language, theme, text, toggleLanguage, toggleTheme } = useSitePreferences();

  return (
    <header className="sticky top-0 z-50 border-b border-pearl-200 bg-white/95 backdrop-blur-xl">
      <div className="h-1 bg-qatar-700" />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <KutubiLogoMotion compact className="shrink-0" />
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
          <Link href="/admin/login" className="btn-secondary hidden h-10 px-3 py-0 sm:flex" aria-label={text(copy.admin)}>
            <UserRoundCog size={16} />
          </Link>
          <CartButton />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-4 gap-1 border-t border-pearl-100 px-4 py-2 lg:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="inline-flex items-center justify-center gap-1 rounded-[10px] px-2 py-2 text-xs font-bold text-zinc-700 hover:bg-pearl-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-qatar-100">
            <item.icon size={14} />
            {text(item.label)}
          </Link>
        ))}
      </div>
    </header>
  );
}
