"use client";

import Link from "next/link";
import { BookOpenText, Instagram, Mail, Phone } from "lucide-react";
import { useSitePreferences } from "./site-preferences";

export function SiteFooter() {
  const { text } = useSitePreferences();

  return (
    <footer className="mt-20 border-t border-pearl-200 bg-[#2d1820] text-white">
      <div className="h-1 bg-qatar-700" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.25fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/20">
              <BookOpenText size={18} />
            </div>
            <div>
              <p className="font-black text-white">موقع كُتبي</p>
              <p className="text-sm text-white/60">{text({ ar: "متجر تعليمي للملفات الرقمية الجاهزة", en: "Educational store for ready digital files" })}</p>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-8 text-white/70">
            {text({
              ar: "منصة لبيع عروض البوربوينت، أوراق العمل، وملفات PDF وDOCX مع تنظيم حسب الصف والمادة ولوحة إدارة محمية.",
              en: "A focused store for PowerPoint lessons, worksheets, PDF and DOCX files, organized by grade and subject."
            })}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-gold-300">{text({ ar: "روابط", en: "Links" })}</h3>
          <div className="mt-4 space-y-3 text-sm font-bold text-white/70">
            <Link href="/products" className="block transition hover:text-white">{text({ ar: "المتجر", en: "Store" })}</Link>
            <Link href="/library" className="block transition hover:text-white">{text({ ar: "المكتبة", en: "Library" })}</Link>
            <Link href="/checkout" className="block transition hover:text-white">{text({ ar: "الدفع", en: "Checkout" })}</Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-gold-300">{text({ ar: "تواصل", en: "Contact" })}</h3>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            <div className="flex items-center gap-2"><Mail size={16} /> support@kutubi.qa</div>
            <div className="flex items-center gap-2"><Phone size={16} /> +974 0000 0000</div>
            <div className="flex items-center gap-2"><Instagram size={16} /> @kutubi.qa</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
