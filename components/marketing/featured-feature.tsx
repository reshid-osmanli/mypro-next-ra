"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useSitePreferences } from "@/components/site-preferences";
import { ProductCard } from "@/components/product-card";
import { ProductCover } from "@/components/store/product-cover";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Price } from "@/components/ui/price";
import { ArrowForward } from "@/components/ui/icon";
import type { ProductCardModel } from "@/components/product-card";

/**
 * Editorial feature — one large product spread like a magazine cover:
 * cover left (7 cols), editorial text + price + CTA right (5 cols).
 */
export function FeaturedFeature({ product }: { product: ProductCardModel }) {
  const { text } = useSitePreferences();
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
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reduced ? 0.01 : 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="card grid overflow-hidden lg:grid-cols-[7fr_5fr]"
    >
      <Link href={`/products/${product.slug}`} className="block outline-none">
        <ProductCover
          title={product.title}
          subject={product.subject}
          category={product.category}
          format={product.format}
          coverImage={product.coverImage}
          additionalImages={product.additionalImages}
          discountPercent={discountPercent}
          sharedElementName={`product-cover-${product.slug}`}
          className="h-full min-h-[300px]"
        />
      </Link>

      <div className="flex flex-col justify-between gap-6 p-7 md:p-9">
        <div>
          <p className="text-label font-bold text-brand-deep">
            {text({ ar: "من المختارات", en: "Featured" })}
          </p>
          <p className="mt-4 text-caption text-ink-faint">
            {product.grade} · {product.subject}
          </p>
          <h3 className="mt-2 text-h2 font-bold leading-snug text-ink">
            <Link href={`/products/${product.slug}`} className="outline-none transition-colors duration-instant hover:text-brand-deep">
              {product.title}
            </Link>
          </h3>
          <p className="mt-4 line-clamp-3 text-body text-ink-soft">{product.excerpt}</p>
          <p className="mt-4 text-body-sm font-medium text-ink-faint">
            {product.format}
            {product.pages ? ` · ${product.pages}` : ""}
            {product.level ? ` · ${product.level}` : ""}
          </p>
        </div>

        <div className="space-y-4 border-t border-line pt-5">
          <Price value={product.price} compareAt={product.compareAt} size="xl" />
          <div className="flex flex-wrap gap-3">
            <AddToCartButton item={cartItem} size="md" />
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex h-11 items-center gap-2 rounded-sm px-4 text-body-sm font-semibold text-ink-soft transition-colors duration-instant hover:bg-paper-deep hover:text-ink"
            >
              {text({ ar: "التفاصيل", en: "Details" })}
              <ArrowForward size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Editorial feature section: 1 large + 2 stacked product cards. */
export function FeaturedSection({ products }: { products: ProductCardModel[] }) {
  const [lead, ...rest] = products;
  if (!lead) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[7fr_5fr]">
      <FeaturedFeature product={lead} />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
        {rest.slice(0, 2).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
