"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Languages, LogIn, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useSitePreferences } from "@/components/site-preferences";
import { cn } from "@/lib/utils";

export const MAIN_NAV = [
  { href: "/", label: { ar: "الرئيسية", en: "Home" } },
  { href: "/products", label: { ar: "المتجر", en: "Store" } },
  { href: "/library", label: { ar: "المكتبة", en: "Library" } },
  { href: "/blog", label: { ar: "المدونة", en: "Blog" } },
  { href: "/purchases", label: { ar: "مشترياتي", en: "My purchases" } }
] as const;

/**
 * Mobile navigation drawer — end-side, spring, full keyboard support.
 */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { language, theme, text, toggleLanguage, toggleTheme, direction } = useSitePreferences();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const reduced = useReducedMotion() ?? false;
  const isAuthenticated = status === "authenticated" && Boolean(session?.user?.email);
  const fromSide = direction === "rtl" ? "-100%" : "100%";

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label={text({ ar: "القائمة", en: "Menu" })}>
          <motion.button
            type="button"
            aria-label={text({ ar: "إغلاق القائمة", en: "Close menu" })}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 w-full cursor-default bg-ink/40 backdrop-blur-[3px]"
          />
          <motion.div
            initial={{ x: fromSide }}
            animate={{ x: 0 }}
            exit={{ x: fromSide }}
            transition={reduced ? { duration: 0.01 } : { type: "spring", stiffness: 340, damping: 34 }}
            className={cn(
              "absolute inset-y-0 flex w-full max-w-[340px] flex-col bg-surface shadow-pop",
              direction === "rtl" ? "inset-inline-start-0 border-e border-line" : "inset-inline-end-0 border-s border-line"
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="text-h4 font-bold text-ink">{text({ ar: "القائمة", en: "Menu" })}</span>
              <button
                type="button"
                onClick={onClose}
                className="grid size-9 place-items-center rounded-sm text-ink-faint transition-colors duration-instant hover:bg-paper-deep hover:text-ink"
                aria-label={text({ ar: "إغلاق", en: "Close" })}
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              <ul className="space-y-0.5">
                {MAIN_NAV.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "block rounded-sm px-4 py-3 text-body font-semibold transition-colors duration-instant",
                          active ? "bg-brand-soft/70 text-brand-deep" : "text-ink-soft hover:bg-paper-deep hover:text-ink"
                        )}
                      >
                        {text(item.label)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="grid gap-2 border-t border-line p-4">
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-line text-body-sm font-semibold text-ink-soft transition-colors duration-instant hover:border-line-strong hover:text-ink"
              >
                <Languages size={16} strokeWidth={1.75} aria-hidden="true" />
                {language === "ar" ? "English" : "العربية"}
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-line text-body-sm font-semibold text-ink-soft transition-colors duration-instant hover:border-line-strong hover:text-ink"
              >
                {theme === "dark" ? <Sun size={16} strokeWidth={1.75} aria-hidden="true" /> : <Moon size={16} strokeWidth={1.75} aria-hidden="true" />}
                {theme === "dark"
                  ? text({ ar: "الوضع النهاري", en: "Light mode" })
                  : text({ ar: "الوضع الليلي", en: "Dark mode" })}
              </button>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-line text-body-sm font-semibold text-ink-soft transition-colors duration-instant hover:border-line-strong hover:text-ink"
                >
                  <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
                  {text({ ar: "تسجيل الخروج", en: "Sign out" })}
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={onClose}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-brand text-body-sm font-semibold text-white transition-colors duration-instant hover:bg-brand-deep"
                >
                  <LogIn size={16} strokeWidth={1.75} aria-hidden="true" />
                  {text({ ar: "تسجيل الدخول", en: "Sign in" })}
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
