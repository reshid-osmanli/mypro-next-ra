"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Price } from "@/components/ui/price";
import { ProductCover } from "@/components/store/product-cover";
import { cn } from "@/lib/utils";

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
  additionalImages?: string[];
  subjectMotionLogo?: string | null;
  /** Rive/motion logo fields — managed in the admin panel; the storefront card does not render them */
  motionEnabled?: boolean;
  motionPosition?: string | null;
  motionScale?: number | null;
  motionRotation?: number | null;
  motionSrc?: string | null;
  files?: { id: string; url: string; title: string; mimeType?: string; size?: number }[];
  reviews?: { rating: number }[];
  averageRating?: number;
  reviewCount?: number;
  featured?: boolean;
  sortOrder?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  status?: string;
};

export type Product = Required<
  Pick<ProductCardModel, "description" | "level" | "status" | "featured" | "compareAt" | "sortOrder">
> &
  Omit<ProductCardModel, "description" | "level" | "status" | "featured" | "compareAt" | "sortOrder"> & {
    files?: { id: string; title: string; url: string; mimeType: string; size: number }[];
  };

/**
 * KUTUBI Product Card — the store's workhorse.
 *
 * Hierarchy (top → bottom): cover → grade/subject → title → meta → price/CTA.
 * Hover (fine pointers only): 3px lift + stronger border + cover zoom 1.02.
 * No fake claims, no mock visuals, no rating noise on the card.
 */
export function ProductCard({
  product,
  sharedElement = false,
  className
}: {
  product: ProductCardModel;
  sharedElement?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;

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
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduced ? 0.01 : 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn("card group overflow-hidden transition-[transform,box-shadow,border-color] duration-fast ease-standard group-hover:-translate-y-[3px] group-hover:border-line-strong group-hover:shadow-lift", className)}
    >
      <Link href={`/products/${product.slug}`} className="block outline-none" aria-label={product.title}>
        <ProductCover
          title={product.title}
          subject={product.subject}
          category={product.category}
          format={product.format}
          coverImage={product.coverImage}
          additionalImages={product.additionalImages}
          discountPercent={discountPercent}
          sharedElementName={sharedElement ? `product-cover-${product.slug}` : undefined}
        />

        <div className="space-y-2 p-5">
          <p className="truncate text-caption text-ink-faint">
            {product.grade} · {product.subject}
          </p>
          <h3 className="line-clamp-2 min-h-[3.2rem] text-h3 font-bold text-ink transition-colors duration-instant group-hover:text-brand-deep">
            {product.title}
          </h3>
          <p className="truncate text-body-sm text-ink-soft">
            {product.format}
            {product.pages ? ` · ${product.pages}` : ""}
          </p>
        </div>
      </Link>

      <div className="flex items-end justify-between gap-3 border-t border-line px-5 pb-5 pt-3.5">
        <Price value={product.price} compareAt={product.compareAt} size="lg" />
        <AddToCartButton item={cartItem} size="sm" className="h-9" />
      </div>
    </motion.article>
  );
}

export default ProductCard;
