"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard, type ProductCardModel } from "@/components/product-card";
import { ProductCover } from "@/components/store/product-cover";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Price } from "@/components/ui/price";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowForward } from "@/components/ui/icon";
import { useSitePreferences } from "@/components/site-preferences";
import { cn } from "@/lib/utils";

type Props = {
  products: ProductCardModel[];
  grades: string[];
  subjects: string[];
  initialSearch?: string;
  initialGrade?: string;
  initialSubject?: string;
};

const ALL = "الكل";

const selectClass =
  "h-11 w-full appearance-none rounded-sm border border-line bg-surface px-3.5 pe-9 text-body text-ink outline-none transition-colors duration-instant focus:border-brand focus:ring-2 focus:ring-brand/25";

/** Horizontal card for the list view — cover + real metadata only. */
function ListProductCard({ product }: { product: ProductCardModel }) {
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
    accentB: product.accentB,
    coverImage: product.coverImage ?? null
  } as const;

  const discountPercent =
    product.compareAt && product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : null;

  return (
    <article className="card group grid overflow-hidden transition-[border-color,box-shadow] duration-fast ease-standard hover:border-line-strong hover:shadow-soft sm:grid-cols-[220px_1fr]">
      <Link href={`/products/${product.slug}`} className="block outline-none">
        <ProductCover
          title={product.title}
          subject={product.subject}
          category={product.category}
          format={product.format}
          coverImage={product.coverImage}
          additionalImages={product.additionalImages}
          discountPercent={discountPercent}
          className="min-h-[170px]"
        />
      </Link>

      <div className="flex flex-col justify-between gap-5 p-5 md:p-6">
        <div>
          <p className="text-caption text-ink-faint">
            {product.grade} · {product.subject}
          </p>
          <h3 className="mt-1.5 text-h3 font-bold leading-snug text-ink transition-colors duration-instant group-hover:text-brand-deep">
            <Link href={`/products/${product.slug}`} className="outline-none">
              {product.title}
            </Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-body-sm leading-8 text-ink-soft">{product.excerpt}</p>
          <p className="mt-3 text-caption font-medium text-ink-faint">
            {product.format}
            {product.pages ? ` · ${product.pages}` : ""}
            {product.level ? ` · ${product.level}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <Price value={product.price} compareAt={product.compareAt} size="lg" />
          <div className="flex items-center gap-2.5">
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-sm px-3 text-body-sm font-semibold text-ink-soft transition-colors duration-instant hover:bg-paper-deep hover:text-ink"
            >
              <ArrowForward size={14} aria-hidden="true" />
              التفاصيل
            </Link>
            <AddToCartButton item={cartItem} size="sm" className="h-10" />
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * KUTUBI product explorer — search + grade/subject/format filters + sort + grid/list.
 * Business logic (client-side filtering) unchanged from the original.
 */
export function ProductExplorer({ products, grades, subjects, initialSearch = "", initialGrade = ALL, initialSubject = ALL }: Props) {
  const { text } = useSitePreferences();
  const reduced = useReducedMotion() ?? false;
  const [search, setSearch] = useState(initialSearch);
  const [grade, setGrade] = useState(initialGrade);
  const [subject, setSubject] = useState(initialSubject);
  const [format, setFormat] = useState(ALL);
  const [sort, setSort] = useState<"recommended" | "price-asc" | "price-desc" | "rating-desc">("recommended");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const subjectsForGrade = useMemo(() => {
    if (grade === ALL) return subjects;
    return Array.from(new Set(products.filter((product) => product.grade === grade).map((product) => product.subject)));
  }, [grade, products, subjects]);

  const formats = useMemo(
    () =>
      Array.from(
        new Set(
          products.flatMap((product) => product.format.split(/[+،,\/]/).map((item) => item.trim()).filter(Boolean))
        )
      ).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const matches = products.filter((product) => {
      const txt = `${product.title} ${product.excerpt} ${product.grade} ${product.subject} ${product.category} ${product.format}`.toLowerCase();
      const matchesSearch = txt.includes(search.toLowerCase());
      const matchesGrade = grade === ALL || product.grade === grade;
      const matchesSubject = subject === ALL || product.subject === subject;
      const matchesFormat = format === ALL || product.format.toLowerCase().includes(format.toLowerCase());
      return matchesSearch && matchesGrade && matchesSubject && matchesFormat;
    });

    return matches.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating-desc") return (b.averageRating ?? 0) - (a.averageRating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (b.sortOrder ?? 0) - (a.sortOrder ?? 0);
    });
  }, [products, search, grade, subject, format, sort]);

  const activeChips: { label: string; clear: () => void }[] = [];
  if (grade !== ALL) activeChips.push({ label: grade, clear: () => { setGrade(ALL); setSubject(ALL); } });
  if (subject !== ALL) activeChips.push({ label: subject, clear: () => setSubject(ALL) });
  if (format !== ALL) activeChips.push({ label: format, clear: () => setFormat(ALL) });
  if (sort !== "recommended") activeChips.push({ label: text({ ar: "ترتيب مخصص", en: "Custom sort" }), clear: () => setSort("recommended") });

  function clearAll() {
    setSearch("");
    setGrade(ALL);
    setSubject(ALL);
    setFormat(ALL);
    setSort("recommended");
  }

  return (
    <div className="space-y-6">
      {/* toolbar */}
      <div className="card space-y-4 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative block flex-1">
            <Search size={16} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-sm border border-line bg-surface ps-11 pe-4 text-body text-ink outline-none transition-colors duration-instant placeholder:text-ink-faint focus:border-brand focus:ring-2 focus:ring-brand/25"
              placeholder={text({ ar: "ابحث عن بوربوينت، صف، مادة أو صيغة...", en: "Search PowerPoint, grade, subject, or format..." })}
              aria-label={text({ ar: "بحث في المنتجات", en: "Search products" })}
            />
          </label>

          <div className="flex items-center justify-between gap-3 md:justify-end">
            {/* mobile filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-sm border px-4 text-body-sm font-semibold transition-colors duration-instant lg:hidden",
                showFilters || activeChips.length > 0
                  ? "border-brand/40 bg-brand-soft text-brand-deep"
                  : "border-line bg-surface text-ink-soft hover:border-line-strong"
              )}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal size={15} aria-hidden="true" />
              {text({ ar: "فلاتر", en: "Filters" })}
              {activeChips.length > 0 ? (
                <span className="tnum grid size-5 place-items-center rounded-pill bg-brand text-[11px] font-bold text-white">
                  {activeChips.length}
                </span>
              ) : null}
            </button>

            {/* view toggle */}
            <div className="flex rounded-sm border border-line bg-surface p-0.5">
              {(["grid", "list"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  aria-pressed={view === mode}
                  className={cn(
                    "grid size-10 place-items-center rounded-sm transition-colors duration-instant",
                    view === mode ? "bg-ink text-paper" : "text-ink-faint hover:text-ink"
                  )}
                  aria-label={mode === "grid" ? text({ ar: "عرض شبكة", en: "Grid view" }) : text({ ar: "عرض قائمة", en: "List view" })}
                >
                  {mode === "grid" ? <LayoutGrid size={16} aria-hidden="true" /> : <List size={16} aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* filters — always visible on lg, toggled on mobile */}
        <div className={cn("grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4", !showFilters && "hidden lg:grid")}>
          {(
            [
              {
                label: text({ ar: "الصف", en: "Grade" }),
                value: grade,
                onChange: (value: string) => { setGrade(value); setSubject(ALL); },
                all: text({ ar: "كل الصفوف", en: "All grades" }),
                options: grades
              },
              {
                label: text({ ar: "المادة", en: "Subject" }),
                value: subject,
                onChange: (value: string) => setSubject(value),
                all: text({ ar: "كل المواد", en: "All subjects" }),
                options: subjectsForGrade
              },
              {
                label: text({ ar: "نوع الملف", en: "File type" }),
                value: format,
                onChange: (value: string) => setFormat(value),
                all: text({ ar: "كل الصيغ", en: "All formats" }),
                options: formats
              },
              {
                label: text({ ar: "الترتيب", en: "Sort" }),
                value: sort,
                onChange: (value: string) => setSort(value as typeof sort),
                all: "",
                options: [] as string[]
              }
            ]
          ).map((field) => (
            <label key={field.label} className="block space-y-1.5">
              <span className="block text-caption font-semibold text-ink-faint">{field.label}</span>
              {field.label === text({ ar: "الترتيب", en: "Sort" }) ? (
                <select className={selectClass} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                  <option value="recommended">{text({ ar: "الموصى به", en: "Recommended" })}</option>
                  <option value="rating-desc">{text({ ar: "الأعلى تقييمًا", en: "Top rated" })}</option>
                  <option value="price-asc">{text({ ar: "السعر الأقل", en: "Lowest price" })}</option>
                  <option value="price-desc">{text({ ar: "السعر الأعلى", en: "Highest price" })}</option>
                </select>
              ) : (
                <select
                  className={selectClass}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  <option value={ALL}>{field.all}</option>
                  {field.options.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              )}
            </label>
          ))}
        </div>

        {/* results count + active chips */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-body-sm">
          <span className="text-ink-soft">
            {text({ ar: "النتائج", en: "Results" })}: <strong className="tnum font-bold text-ink">{filtered.length}</strong>
          </span>
          {activeChips.length > 0 ? (
            <>
              <span className="hidden text-line-strong sm:inline" aria-hidden="true">|</span>
              <div className="flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={chip.clear}
                    className="inline-flex h-7 items-center gap-1.5 rounded-pill border border-line bg-surface px-3 text-caption font-semibold text-ink-soft transition-colors duration-instant hover:border-accent-danger/50 hover:text-accent-danger"
                    aria-label={text({ ar: "إزالة فلتر", en: "Remove filter" }) + " " + chip.label}
                  >
                    {chip.label}
                    <X size={12} aria-hidden="true" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-caption font-semibold text-brand-deep transition-colors duration-instant hover:text-brand"
                >
                  {text({ ar: "مسح الكل", en: "Clear all" })}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={text({ ar: "لا توجد نتائج مطابقة", en: "No matching results" })}
          description={text({
            ar: "جرّب تعديل البحث أو إزالة بعض الفلاتر لعرض المزيد من المنتجات.",
            en: "Try adjusting the search or removing some filters to see more products."
          })}
          action={
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-line-strong px-4 text-body-sm font-semibold text-ink transition-colors duration-instant hover:bg-paper-deep"
            >
              <X size={14} aria-hidden="true" />
              {text({ ar: "مسح الفلاتر", en: "Clear filters" })}
            </button>
          }
        />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
            className={view === "grid" ? "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3" : "space-y-5"}
          >
            {filtered.map((product) =>
              view === "grid" ? (
                <ProductCard key={product.id} product={product} />
              ) : (
                <ListProductCard key={product.id} product={product} />
              )
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
