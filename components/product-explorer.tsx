"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LayoutGrid, ListFilter, Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard, type ProductCardModel } from "./product-card";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductVisual } from "./product-visual";
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
        <ProductVisual
          title={product.title}
          subject={product.subject}
          category={product.category}
          format={product.format}
          badge={product.badge}
          accentA={product.accentA}
          accentB={product.accentB}
          coverImage={product.coverImage}
          subjectMotionLogo={product.subjectMotionLogo}
        />
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
  const [format, setFormat] = useState(ALL);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [sort, setSort] = useState<"recommended" | "price-asc" | "price-desc" | "rating-desc">("recommended");
  const [view, setView] = useState<"grid" | "list">("grid");

  const subjectsForGrade = useMemo(() => {
    if (grade === ALL) return subjects;
    return Array.from(new Set(products.filter((product) => product.grade === grade).map((product) => product.subject)));
  }, [grade, products, subjects]);

  const formats = useMemo(() => Array.from(new Set(products.flatMap((product) => product.format.split(/[+،,\/]/).map((item) => item.trim()).filter(Boolean)))).sort(), [products]);
  const highestPrice = useMemo(() => Math.max(0, ...products.map((product) => product.price)), [products]);
  const effectiveMaxPrice = maxPrice > 0 ? maxPrice : highestPrice;

  const filtered = useMemo(() => {
    const matches = products.filter((product) => {
      const text = `${product.title} ${product.excerpt} ${product.grade} ${product.subject} ${product.category} ${product.format}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesGrade = grade === ALL || product.grade === grade;
      const matchesSubject = subject === ALL || product.subject === subject;
      const matchesFormat = format === ALL || product.format.toLowerCase().includes(format.toLowerCase());
      const matchesRating = (product.averageRating ?? 0) >= minRating;
      const matchesPrice = effectiveMaxPrice <= 0 || product.price <= effectiveMaxPrice;
      return matchesSearch && matchesGrade && matchesSubject && matchesFormat && matchesRating && matchesPrice;
    });

    return matches.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating-desc") return (b.averageRating ?? 0) - (a.averageRating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (b.sortOrder ?? 0) - (a.sortOrder ?? 0);
    });
  }, [products, search, grade, subject, format, minRating, effectiveMaxPrice, sort]);

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
        {(grade !== ALL || subject !== ALL || format !== ALL || minRating > 0 || maxPrice > 0 || sort !== "recommended" || search) ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setGrade(ALL);
              setSubject(ALL);
              setFormat(ALL);
              setMinRating(0);
              setMaxPrice(0);
              setSort("recommended");
            }}
            className="chip border-qatar-100 bg-qatar-50 px-3 py-1.5 text-qatar-800 hover:bg-qatar-100"
          >
            <X size={14} /> {text({ ar: "مسح الفلاتر", en: "Clear filters" })}
          </button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-lg border border-pearl-200 bg-white p-5 shadow-sm lg:sticky lg:top-28">
          <div className="flex items-center gap-2 text-lg font-black text-zinc-950">
            <SlidersHorizontal size={18} className="text-qatar-700" />
            {text({ ar: "بحث متقدم", en: "Advanced filters" })}
          </div>
          <div className="mt-5 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-zinc-700">{text({ ar: "الصف", en: "Grade" })}</span>
              <select className="input" value={grade} onChange={(e) => {
                setGrade(e.target.value);
                setSubject(ALL);
              }}>
                <option value={ALL}>{text({ ar: "كل الصفوف", en: "All grades" })}</option>
                {grades.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-zinc-700">{text({ ar: "المادة", en: "Subject" })}</span>
              <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value={ALL}>{text({ ar: "كل المواد", en: "All subjects" })}</option>
                {subjectsForGrade.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-zinc-700">{text({ ar: "نوع الملف", en: "File type" })}</span>
              <select className="input" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value={ALL}>{text({ ar: "كل الصيغ", en: "All formats" })}</option>
                {formats.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-zinc-700">{text({ ar: "السعر الأعلى", en: "Max price" })}: {currencyLabel(effectiveMaxPrice || 0)}</span>
              <input type="range" min="0" max={highestPrice || 0} value={effectiveMaxPrice || 0} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-qatar-700" />
              <button type="button" onClick={() => setMaxPrice(0)} className="text-xs font-bold text-qatar-700 hover:underline">{text({ ar: "كل الأسعار", en: "All prices" })}</button>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-zinc-700">{text({ ar: "التقييم الأدنى", en: "Minimum rating" })}</span>
              <select className="input" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
                <option value={0}>{text({ ar: "أي تقييم", en: "Any rating" })}</option>
                <option value={4}>4★+</option>
                <option value={3}>3★+</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-zinc-700">{text({ ar: "الترتيب", en: "Sort" })}</span>
              <select className="input" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                <option value="recommended">{text({ ar: "الموصى به", en: "Recommended" })}</option>
                <option value="rating-desc">{text({ ar: "الأعلى تقييمًا", en: "Top rated" })}</option>
                <option value="price-asc">{text({ ar: "السعر الأقل", en: "Lowest price" })}</option>
                <option value="price-desc">{text({ ar: "السعر الأعلى", en: "Highest price" })}</option>
              </select>
            </label>
          </div>
        </aside>

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
      </div>

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
