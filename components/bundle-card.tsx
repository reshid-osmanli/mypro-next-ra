"use client";

// ============================================================================
// components/bundle-card.tsx — Bundle display card
// ----------------------------------------------------------------------------
// New file: /components/bundle-card.tsx
// ============================================================================

import Link from "next/link";
import { motion } from "framer-motion";
import { Layers3, Package, ChevronLeft, FileText } from "lucide-react";
import { currencyLabel } from "@/lib/utils";
import { AddToCartButton } from "@/components/add-to-cart-button";

type BundleProduct = {
  id: string;
  title: string;
  grade: string;
  subject: string;
  format: string;
  coverImage: string | null;
};

type Props = {
  bundle: {
    id: string;
    slug: string;
    title: string;
    description: string;
    price: number;
    compareAt: number | null;
    discountPercent: number;
    coverImage: string | null;
    badge: string | null;
    items: BundleProduct[];
  };
};

export function BundleCard({ bundle }: Props) {
  const savings = bundle.compareAt ? Math.max(0, bundle.compareAt - bundle.price) : 0;

  // Build a synthetic cart item composed of the bundle's first product price × item count
  // (actual checkout uses real product IDs through /api/bundle-checkout)
  const fallback = bundle.items[0];

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="overflow-hidden rounded-2xl border border-pearl-200 bg-white shadow-[0_18px_50px_rgba(60,32,18,0.06)]"
    >
      <div className="relative aspect-[16/9] bg-pearl-100">
        {bundle.coverImage ? (
          <img src={bundle.coverImage} alt={bundle.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-pearl-300">
            <Layers3 size={64} />
          </div>
        )}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          {bundle.badge && (
            <span className="rounded-full bg-qatar-700 px-3 py-1 text-xs font-black text-white shadow-md">
              {bundle.badge}
            </span>
          )}
          {bundle.discountPercent > 0 && (
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white shadow-md">
              وفّر {bundle.discountPercent}%
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-black leading-tight text-zinc-950">{bundle.title}</h3>
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
            <Package size={14} />
            {bundle.items.length} منتجات
          </div>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-7 text-zinc-600">{bundle.description}</p>

        <ul className="mt-4 space-y-1.5 text-sm">
          {bundle.items.slice(0, 4).map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-zinc-700">
              <FileText size={14} className="shrink-0 text-qatar-700" />
              <span className="truncate">{item.title}</span>
            </li>
          ))}
          {bundle.items.length > 4 ? (
            <li className="text-xs font-bold text-zinc-500">+{bundle.items.length - 4} منتج إضافي</li>
          ) : null}
        </ul>

        <div className="mt-5 flex items-end gap-2">
          <span className="text-2xl font-black text-qatar-800">{currencyLabel(bundle.price)}</span>
          {bundle.compareAt && bundle.compareAt > bundle.price ? (
            <>
              <span className="text-sm text-zinc-400 line-through">
                {currencyLabel(bundle.compareAt)}
              </span>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-700">
                وفّر {currencyLabel(savings)}
              </span>
            </>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {fallback ? (
            <AddToCartButton
              item={{
                id: bundle.id,
                slug: bundle.slug,
                title: bundle.title,
                price: bundle.price,
                grade: "حقيبة",
                subject: bundle.items.map((i) => i.subject).filter((v, i, a) => a.indexOf(v) === i).join("، "),
                badge: "حقيبة",
                format: bundle.items.length + " ملفات",
                accentA: "#8a1538",
                accentB: "#0f766e",
              }}
              className="btn-primary !text-sm"
            />
          ) : null}
          <Link
            href={`/bundles/${bundle.slug}`}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-qatar-700 transition hover:bg-qatar-50"
          >
            عرض التفاصيل
            <ChevronLeft size={16} className="rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
