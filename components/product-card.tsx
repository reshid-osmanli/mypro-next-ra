"use client";

import Link from "next/link";
import { ArrowLeft, BadgeCheck, BookOpen, Layers3 } from "lucide-react";
import { motion } from "framer-motion";
import { AddToCartButton } from "./add-to-cart-button";
import { currencyLabel } from "@/lib/utils";
import { ProductVisual } from "./product-visual";
import { useSitePreferences } from "./site-preferences";
import { SubjectMotionLogo } from "./subject-motion-logo";

export type ProductCardModel = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  description?: string;
  price: number;
  compareAt: number | null;
  badge: string;
  grade: string;
  subject: string;
  category: string;
  format: string;
  pages: string;
  level: string;
  accentA: string;
  accentB: string;
  coverImage?: string | null;
  subjectMotionLogo?: string | null;
  files?: { id: string; url: string; title: string }[];
};

function ProductCard({ product }: { product: ProductCardModel }) {
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
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="group overflow-hidden rounded-lg border border-pearl-200 bg-white shadow-[0_18px_50px_rgba(60,32,18,0.06)]"
    >
      <div className="relative overflow-hidden bg-pearl-100">
        <div className="aspect-[1.35/1] sm:aspect-[1.45/1]">
          {product.coverImage ? (
            <img
              src={product.coverImage}
              alt={product.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
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
        </div>
        {product.coverImage ? <SubjectMotionLogo src={product.subjectMotionLogo} subject={product.subject} compact className="absolute left-4 top-4 z-20" /> : null}
        {product.coverImage ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-md bg-white/20 px-3 py-1 text-[11px] font-semibold backdrop-blur">{product.grade}</span>
              <span className="rounded-md bg-white/20 px-3 py-1 text-[11px] font-semibold backdrop-blur">{product.badge}</span>
            </div>
            <p className="mt-4 text-lg font-black leading-8">{product.title}</p>
          </div>
        ) : null}
      </div>

      <div className="space-y-5 p-6 lg:p-7">
        <div className="flex flex-wrap gap-2 text-xs">
          {[product.grade, product.subject, product.format, product.pages].map((tag) => (
            <span key={tag} className="rounded-md bg-pearl-100 px-3 py-1.5 font-semibold text-zinc-700">
              {tag}
            </span>
          ))}
        </div>

        <p className="max-w-2xl text-sm leading-7 text-zinc-600" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" as const }}>{product.excerpt}</p>

        <div className="grid gap-3 text-sm text-zinc-600">
          {[
            { icon: BadgeCheck, value: { ar: "منظّم للصف والمادة", en: "Organized by grade and subject" } },
            { icon: BookOpen, value: { ar: "جاهز للطباعة أو التحميل", en: "Ready to print or download" } },
            { icon: Layers3, value: { ar: "مصمم كملف رقمي حقيقي", en: "Presented like a real digital pack" } }
          ].map(({ icon: Icon, value }) => (
            <div key={text(value)} className="flex items-center gap-2">
              <Icon size={16} className="text-qatar-700" />
              <span>{text(value)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-pearl-200 pt-4">
          <div>
            <p className="text-xs text-zinc-500">{text({ ar: "السعر", en: "Price" })}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-black text-qatar-800">{currencyLabel(product.price)}</span>
              {product.compareAt ? <span className="text-sm text-zinc-400 line-through">{currencyLabel(product.compareAt)}</span> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AddToCartButton item={cartItem} compact />
            <Link
              href={`/products/${product.slug}`}
              className="btn-secondary h-11 w-11 px-0 py-0 text-qatar-700"
            >
              <ArrowLeft size={18} />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default ProductCard;
export { ProductCard };
