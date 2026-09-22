"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useSitePreferences } from "@/components/site-preferences";
import { LogoMark } from "@/components/store/logo";

const navGroups = [
  {
    title: { ar: "المتجر", en: "Store" },
    links: [
      { href: "/products", label: { ar: "كل المنتجات", en: "All products" } },
      { href: "/library", label: { ar: "مكتبة الصفوف", en: "Grade library" } },
      { href: "/cart", label: { ar: "السلة", en: "Cart" } }
    ]
  },
  {
    title: { ar: "حسابي", en: "Account" },
    links: [
      { href: "/purchases", label: { ar: "مشترياتي", en: "My purchases" } },
      { href: "/affiliates", label: { ar: "برنامج العمولة", en: "Affiliate program" } },
      { href: "/login", label: { ar: "تسجيل الدخول", en: "Sign in" } }
    ]
  },
  {
    title: { ar: "المحتوى", en: "Content" },
    links: [
      { href: "/blog", label: { ar: "المدونة", en: "Blog" } },
      { href: "/library", label: { ar: "الصفوف والمواد", en: "Grades & subjects" } }
    ]
  }
] as const;

/**
 * KUTUBI footer — dark ink surface, organized columns, no wall of text.
 * Depth comes from the surface change, not shadows.
 */
export function SiteFooter() {
  const { text } = useSitePreferences();

  return (
    <footer className="mt-20 border-t-2 border-brand bg-ink-deep text-white">
      <div className="container-wide py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-9" />
              <span className="text-h4 font-bold">كُتبي</span>
            </div>
            <p className="mt-4 max-w-xs text-body-sm leading-8 text-white/60">
              {text({
                ar: "متجر موارد تعليمية رقمية: عروض بوربوينت، أوراق عمل، وملفات PDF وDOCX مرتبة حسب الصف والمادة.",
                en: "A store of digital teaching resources: PowerPoint decks, worksheets, and PDF/DOCX files organized by grade and subject."
              })}
            </p>
            <div className="mt-5 flex items-center gap-2 text-body-sm text-white/60">
              <Mail size={15} strokeWidth={1.75} aria-hidden="true" />
              <span dir="ltr">support@kutubi.qa</span>
            </div>
          </div>

          {/* nav groups */}
          {navGroups.map((group) => (
            <div key={group.title.ar}>
              <h3 className="text-label font-bold text-white/40">{text(group.title)}</h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-body-sm font-medium text-white/75 transition-colors duration-instant hover:text-white">
                      {text(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-caption text-white/40">
            © {new Date().getFullYear()} {text({ ar: "كُتبي", en: "Kutubi" })}. {text({ ar: "جميع الحقوق محفوظة.", en: "All rights reserved." })}
          </p>
          <p className="text-caption text-white/40">
            {text({ ar: "دفع آمن · تحميل فوري · ملفات خاصة", en: "Secure payment · Instant download · Private files" })}
          </p>
        </div>
      </div>
    </footer>
  );
}
