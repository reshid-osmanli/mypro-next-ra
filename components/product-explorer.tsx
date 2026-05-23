"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LayoutGrid, ListFilter, Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard, type ProductCardModel } from "./product-card";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductVisual } from "./product-visual";
import { SubjectMotionLogo } from "./subject-motion-logo";
import { currencyLabel } from "@/lib/utils";
import { useSitePreferences } from "./site-preferences";

type Props = {
  products: ProductCardModel[];
  grades: string[];
  subjects: string[];
  initialSearch?: string;
  initialGrade?: string;
  initialSubject?: string;
};

const ALL = "الكل";

function ListProductCard({ product }: { product: ProductCardModel }) {
  const { text } = useSitePreferences();
  const cartItem = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    price: product.price,
    grade: product.grade,
    subject: product.subject,
    badge: product.badge,
    format: product.format,
    accentA: product.accentA,
    accentB: product.accentB
  } as const;

  return (
    <article className="overflow-hidden rounded-lg border border-pearl-200 bg-white shadow-[0_18px_50px_rgba(60,32,18,0.05)] lg:grid lg:grid-cols-[0.88fr_1.12fr]">
      <div className="relative min-h-[18rem] bg-pearl-100">
        {product.coverImage ? (
          <img src={product.coverImage} alt={product.title} className="h-full w-full object-cover" />
        ) : (
          <ProductVisual
            title={product.title}
            subject={product.subject}
            category={product.category}
            format={product.format}
            badge={product.badge}
            accentA={product.accentA}
            accentB={product.accentB}
            subjectMotionLogo={product.subjectMotionLogo}
          />
        )}
        {product.coverImage ? <SubjectMotionLogo src={product.subjectMotionLogo} subject={product.subject} compact className="absolute left-4 top-4 z-20" /> : null}
      </div>
      <div className="space-y-4 p-5 lg:p-6">
        <div className="flex flex-wrap gap-2 text-xs">
          {[product.grade, product.subject, product.format].map((tag) => (
            <span key={tag} className="rounded-md bg-pearl-100 px-3 py-1.5 font-bold text-zinc-700">{tag}</span>
          ))}
        </div>
        <h3 className="text-2xl font-black leading-tight text-zinc-950">{product.title}</h3>
        <p className="line-clamp-3 text-sm leading-7 text-zinc-600">{product.excerpt}</p>
        <div className="grid gap-2 text-sm text-zinc-600">
          {[
            { ar: "مرتب حسب الصف والمادة", en: "Sorted by grade and subject" },
            { ar: "معاينة بصرية واضحة", en: "Clear visual preview" },
            { ar: "مناسب لعروض البوربوينت والملفات التعليمية", en: "Built for PowerPoint and teaching files" }
          ].map((feature) => (
            <div key={text(feature)} className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-700" />
              <span>{text(feature)}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-pearl-200 pt-4">
          <div>
            <p className="text-xs text-zinc-500">{text({ ar: "السعر", en: "Price" })}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-black text-qatar-800">{currencyLabel(product.price)}</span>
              {product.compareAt ? <span className="text-sm text-zinc-400 line-through">{currencyLabel(product.compareAt)}</span> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AddToCartButton item={cartItem} compact />
            <Link href={`/products/${product.slug}`} className="btn-secondary h-11 w-11 px-0 py-0 text-qatar-700">
              <ArrowLeft size={18} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductExplorer({ products, grades, subjects, initialSearch = "", initialGrade = ALL, initialSubject = ALL }: Props) {
  const { text } = useSitePreferences();
  const [search, setSearch] = useState(initialSearch);
  const [grade, setGrade] = useState(initialGrade);
  const [subject, setSubject] = useState(initialSubject);
  const [view, setView] = useState<"grid" | "list">("grid");

  const subjectsForGrade = useMemo(() => {
    if (grade === ALL) return subjects;
    return Array.from(new Set(products.filter((product) => product.grade === grade).map((product) => product.subject)));
  }, [grade, products, subjects]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const text = `${product.title} ${product.excerpt} ${product.grade} ${product.subject} ${product.category}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesGrade = grade === ALL || product.grade === grade;
      const matchesSubject = subject === ALL || product.subject === subject;
      return matchesSearch && matchesGrade && matchesSubject;
    });
  }, [products, search, grade, subject]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-pearl-200 bg-white p-5 shadow-sm lg:grid lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:gap-4">
        <label className="relative block">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pr-12"
            placeholder={text({ ar: "ابحث عن بوربوينت، صف، مادة أو صيغة...", en: "Search PowerPoint, grade, subject, or format..." })}
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2 lg:mt-0 lg:justify-end">
          <button type="button" onClick={() => setView("grid")} className={`chip ${view === "grid" ? "border-qatar-300 bg-qatar-50 text-qatar-800" : ""}`}>
            <LayoutGrid size={16} /> {text({ ar: "شبكة", en: "Grid" })}
          </button>
          <button type="button" onClick={() => setView("list")} className={`chip ${view === "list" ? "border-qatar-300 bg-qatar-50 text-qatar-800" : ""}`}>
            <ListFilter size={16} /> {text({ ar: "قائمة", en: "List" })}
          </button>
          <span className="chip cursor-default bg-zinc-50 text-zinc-600">
            <SlidersHorizontal size={16} /> {text({ ar: "فلترة مباشرة", en: "Live filters" })}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-pearl-200 bg-white px-4 py-3 text-sm text-zinc-600">
        <span>
          {text({ ar: "النتائج", en: "Results" })}: <strong className="text-zinc-950">{filtered.length}</strong>
        </span>
        <span className="text-zinc-300">·</span>
        <span>{text({ ar: "الصفوف", en: "Grades" })}: {grades.length}</span>
        <span className="text-zinc-300">·</span>
        <span>{text({ ar: "المواد", en: "Subjects" })}: {subjects.length}</span>
        {(grade !== ALL || subject !== ALL || search) ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setGrade(ALL);
              setSubject(ALL);
            }}
            className="chip border-qatar-100 bg-qatar-50 px-3 py-1.5 text-qatar-800 hover:bg-qatar-100"
          >
            <X size={14} /> {text({ ar: "مسح الفلاتر", en: "Clear filters" })}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <select className="input max-w-[14rem]" value={grade} onChange={(e) => {
          setGrade(e.target.value);
          setSubject(ALL);
        }}>
          <option value={ALL}>{text({ ar: "كل الصفوف", en: "All grades" })}</option>
          {grades.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="input max-w-[14rem]" value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value={ALL}>{text({ ar: "كل المواد", en: "All subjects" })}</option>
          {subjectsForGrade.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <AnimatePresence mode="popLayout">
        {view === "grid" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-6 xl:grid-cols-2">
            {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            {filtered.map((product) => <ListProductCard key={product.id} product={product} />)}
          </motion.div>
        )}
      </AnimatePresence>

      {!filtered.length ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-600">
          {text({
            ar: "لا توجد نتائج مطابقة. جرّب فلاتر مختلفة أو أضف منتجاً جديداً من لوحة الإدارة.",
            en: "No matching results. Try different filters or add a product from the admin panel."
          })}
        </div>
      ) : null}
    </div>
  );
}
