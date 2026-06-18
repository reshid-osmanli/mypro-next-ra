"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpenText, FileText, GraduationCap, Search, ShieldCheck, UploadCloud, WalletCards } from "lucide-react";
import { motion } from "framer-motion";
import { type FormEvent, useMemo, useState } from "react";
import { ProductVisual } from "./product-visual";
import { useSitePreferences, type LocalizedTextValue } from "./site-preferences";
import { MotionShowcase } from "./motion-showcase";

type HeroProps = {
  eyebrow?: LocalizedTextValue;
  title?: LocalizedTextValue;
  description?: LocalizedTextValue;
  primaryColor?: string;
  secondaryColor?: string;
  primaryCtaLabel?: LocalizedTextValue;
  primaryCtaHref?: string;
  secondaryCtaLabel?: LocalizedTextValue;
  secondaryCtaHref?: string;
};

const quickLinks = [
  { label: { ar: "عروض PowerPoint", en: "PowerPoint decks" }, href: "/products?search=بوربوينت" },
  { label: { ar: "أوراق عمل", en: "Worksheets" }, href: "/products?search=ورقة%20عمل" },
  { label: { ar: "حسب الصف", en: "By grade" }, href: "/library" }
];

const trustPoints = [
  { icon: UploadCloud, title: { ar: "رفع منظم", en: "Structured uploads" }, text: { ar: "PPTX وPDF وDOCX داخل ملفات خاصة.", en: "PPTX, PDF, and DOCX delivered as protected files." } },
  { icon: ShieldCheck, title: { ar: "تحميل آمن", en: "Secure downloads" }, text: { ar: "روابط مؤقتة بعد الدفع فقط.", en: "Temporary links are issued only after payment." } },
  { icon: WalletCards, title: { ar: "PayPal وStripe", en: "PayPal and Stripe" }, text: { ar: "بوابات دفع موثوقة بدون طلب إثبات دفع يدوي.", en: "Trusted payment gateways with no manual payment proof flow." } }
];

function Hero({
  eyebrow = { ar: "منصة تعليمية عربية", en: "Arabic educational platform" },
  title = { ar: "متجر رقمي احترافي لبيع عروض البوربوينت وأوراق العمل", en: "A professional digital store for PowerPoint lessons and worksheets" },
  description = {
    ar: "كُتبي يجمع بين متجر جذاب، مكتبة مرتبة حسب الصف والمادة، ولوحة إدارة آمنة لإضافة المنتجات والملفات والأسعار بسرعة.",
    en: "Kutubi combines a polished storefront, grade-and-subject browsing, and secure admin tools for digital teaching files."
  },
  primaryColor = "#8a1538",
  secondaryColor = "#0f766e",
  primaryCtaLabel = { ar: "تصفح المنتجات", en: "Browse products" },
  primaryCtaHref = "/products",
  secondaryCtaLabel = { ar: "عرض المكتبة", en: "View library" },
  secondaryCtaHref = "/library"
}: HeroProps) {
  const router = useRouter();
  const { text } = useSitePreferences();
  const [query, setQuery] = useState("");

  const stats = useMemo(
    () => [
      ["PPTX", text({ ar: "عروض قابلة للتعديل", en: "Editable decks" })],
      ["DOCX", text({ ar: "ملفات تعليمية", en: "Teaching files" })],
      ["PDF", text({ ar: "نسخ جاهزة للطباعة", en: "Print-ready copies" })]
    ],
    [text]
  );

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
  }

  return (
    <section className="relative overflow-hidden border-b border-pearl-200 bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-qatar-700" />

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 lg:px-8 lg:pb-16 lg:pt-14">
        <div className="grid gap-10 xl:grid-cols-[0.92fr_1.08fr] xl:items-center">
          <div className="space-y-7">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-md border border-pearl-200 bg-white px-4 py-2 text-sm font-bold text-zinc-800 shadow-sm">
              <BookOpenText size={16} className="text-qatar-700" />
              {text(eyebrow)}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-black leading-[1.16] text-zinc-950 md:text-6xl">
                {text(title)}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-zinc-600 md:text-lg">{text(description)}</p>
            </motion.div>

            <form onSubmit={handleSearch} className="max-w-2xl">
              <div className="flex overflow-hidden rounded-lg border border-pearl-200 bg-white shadow-[0_18px_45px_rgba(60,32,18,0.09)]">
                <button type="submit" className="flex items-center justify-center border-l border-pearl-100 px-5 text-qatar-800 transition hover:bg-qatar-50" aria-label={text({ ar: "بحث", en: "Search" })}>
                  <Search size={19} />
                </button>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={text({ ar: "ابحث عن صف، مادة، عرض أو ورقة عمل...", en: "Search by grade, subject, deck, or worksheet..." })}
                  className="h-16 flex-1 border-0 bg-transparent px-4 text-base outline-none placeholder:text-zinc-400"
                />
                <Link href="/products" className="hidden items-center gap-2 bg-qatar-700 px-5 text-sm font-bold text-white transition hover:bg-qatar-800 sm:flex">
                  {text({ ar: "المتجر", en: "Store" })}
                  <ArrowLeft size={16} />
                </Link>
              </div>
            </form>

            <div className="flex flex-wrap gap-3">
              <Link href={primaryCtaHref} className="btn-primary px-5 py-3">
                {text(primaryCtaLabel)}
                <ArrowLeft size={16} />
              </Link>
              <Link href={secondaryCtaHref} className="btn-secondary px-5 py-3">
                {text(secondaryCtaLabel)}
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              {quickLinks.map((item) => (
                <Link key={text(item.label)} href={item.href} className="inline-flex items-center gap-2 rounded-md border border-pearl-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-qatar-200 hover:bg-qatar-50 hover:text-qatar-800">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: text(item.label).includes("Power") ? primaryColor : text(item.label).includes("عمل") || text(item.label).includes("Worksheet") ? "#0f766e" : "#d89b32" }} />
                  {text(item.label)}
                </Link>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map(([value, label]) => (
                <div key={value} className="rounded-lg border border-pearl-200 bg-white p-4 shadow-sm">
                  <p className="text-xl font-black text-zinc-950">{value}</p>
                  <p className="mt-1 text-sm text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="relative">
            <MotionShowcase variant="logo" className="mb-4" />
            <div className="overflow-hidden rounded-lg border border-pearl-200 bg-white shadow-[0_20px_45px_rgba(60,32,18,0.08)]">
              <div className="flex items-center justify-between gap-4 border-b border-qatar-800 bg-qatar-700 px-4 py-3 text-white">
                <div className="flex items-center gap-2 text-sm font-black">
                  <BookOpenText size={17} />
                  {text({ ar: "مختارات المتجر", en: "Store picks" })}
                </div>
                <div className="text-xs font-bold text-white/80">
                  {text({ ar: "ملفات رقمية جاهزة", en: "Ready digital files" })}
                </div>
              </div>

              <div className="grid gap-4 bg-pearl-50 p-4 lg:grid-cols-[1fr_0.78fr]">
                <div className="overflow-hidden rounded-lg border border-pearl-200 bg-white">
                  <div className="h-full min-h-[24rem]">
                    <ProductVisual
                      title={text({ ar: "حزمة عروض اللغة العربية للمرحلة الابتدائية", en: "Arabic language presentation bundle for primary grades" })}
                      subject={text({ ar: "اللغة العربية", en: "Arabic language" })}
                      category={text({ ar: "بوربوينت", en: "PowerPoint" })}
                      format="PPTX + PDF"
                      badge={text({ ar: "الأكثر طلباً", en: "Most requested" })}
                      accentA={primaryColor}
                      accentB={secondaryColor}
                    />
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-lg border border-pearl-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-950">{text({ ar: "المكتبة الدراسية", en: "Study library" })}</p>
                        <p className="text-xs text-zinc-500">{text({ ar: "صفوف ومواد بترتيب واضح", en: "Grades and subjects in a clear order" })}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-zinc-700">
                      {[
                        text({ ar: "الصف الأول", en: "Grade 1" }),
                        text({ ar: "الرياضيات", en: "Math" }),
                        text({ ar: "العلوم", en: "Science" }),
                        text({ ar: "اللغة العربية", en: "Arabic" })
                      ].map((item) => (
                        <span key={item} className="rounded-md bg-pearl-100 px-3 py-2">{item}</span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-pearl-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-zinc-950">{text({ ar: "ملفات المنتج", en: "Product files" })}</p>
                        <p className="mt-1 text-xs text-zinc-500">{text({ ar: "جاهزة للتسليم بعد الدفع", en: "Ready after payment" })}</p>
                      </div>
                      <FileText size={20} className="text-qatar-700" />
                    </div>
                    <div className="mt-4 space-y-2">
                      {["lesson-intro.pptx", "worksheet.docx", "print-copy.pdf"].map((file) => (
                        <div key={file} className="flex items-center justify-between rounded-md bg-pearl-100 px-3 py-2 text-xs font-bold text-zinc-700">
                          <span>{file}</span>
                          <ShieldCheck size={13} className="text-emerald-700" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {trustPoints.map(({ icon: Icon, title: itemTitle, text: itemText }) => (
                <div key={text(itemTitle)} className="rounded-lg border border-pearl-200 bg-white p-4 shadow-sm">
                  <Icon size={18} className="text-qatar-700" />
                  <p className="mt-3 text-sm font-black text-zinc-950">{text(itemTitle)}</p>
                  <p className="mt-1 text-xs leading-6 text-zinc-500">{text(itemText)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
export { Hero };
