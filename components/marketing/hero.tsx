"use client";

import Link from "next/link";
import { FileLock2, ShieldCheck, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useSitePreferences, type LocalizedTextValue } from "@/components/site-preferences";
import { TextReveal } from "@/components/motion/text-reveal";
import { Parallax } from "@/components/motion/parallax";
import { ProductCover } from "@/components/store/product-cover";
import { ArrowForward } from "@/components/ui/icon";
import type { ProductCardModel } from "@/components/product-card";
import { cn, currencyLabel } from "@/lib/utils";

type HeroProps = {
  eyebrow: LocalizedTextValue;
  title: LocalizedTextValue;
  description: LocalizedTextValue;
  primaryCtaLabel: LocalizedTextValue;
  primaryCtaHref: string;
  secondaryCtaLabel: LocalizedTextValue;
  secondaryCtaHref: string;
  /** real products for the visual composition (first = largest) */
  products: ProductCardModel[];
};

const trustPoints = [
  { icon: Zap, label: { ar: "تحميل فوري بعد الدفع", en: "Instant download after payment" } },
  { icon: ShieldCheck, label: { ar: "دفع آمن Stripe وPayPal", en: "Secure payment via Stripe & PayPal" } },
  { icon: FileLock2, label: { ar: "ملفات خاصة بروابط مؤقتة", en: "Private files, temporary links" } }
] as const;

/**
 * KUTUBI Hero — editorial composition.
 * Left (start): statement + CTAs. Right (end): layered product previews
 * from the real catalog with a whisper of parallax.
 * Entrance: eyebrow → headline (word reveal) → lead → CTAs → visual.
 */
export function Hero({
  eyebrow,
  title,
  description,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  products
}: HeroProps) {
  const { text } = useSitePreferences();
  const reduced = useReducedMotion() ?? false;
  const [primary, secondary, tertiary] = products.slice(0, 3);

  const fade = (delay: number) => ({
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0.01 : 0.45, delay: reduced ? 0 : delay, ease: [0.16, 1, 0.3, 1] as const }
  });

  return (
    <section className="border-b border-line bg-paper">
      <div className="container-content">
        <div className="grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:py-24">
          {/* statement */}
          <div className="max-w-[42rem]">
            <motion.p
              {...fade(0)}
              className="inline-flex items-center gap-2 text-label font-bold text-brand-deep"
            >
              <span className="h-px w-8 bg-brand" aria-hidden="true" />
              {text(eyebrow)}
            </motion.p>

            <h1 className="mt-5 text-display font-bold tracking-[-0.01em] text-ink">
              <TextReveal text={text(title)} startDelay={0.08} step={0.055} />
            </h1>

            <motion.p {...fade(0.3)} className="mt-6 max-w-[36rem] text-lead text-ink-soft">
              {text(description)}
            </motion.p>

            <motion.div {...fade(0.42)} className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={primaryCtaHref}
                className="inline-flex h-12 items-center gap-2.5 rounded-sm bg-brand px-6 text-body font-semibold text-white shadow-soft transition-[background-color,transform] duration-instant ease-standard hover:-translate-y-px hover:bg-brand-deep active:translate-y-0"
              >
                {text(primaryCtaLabel)}
                <ArrowForward size={16} />
              </Link>
              <Link
                href={secondaryCtaHref}
                className="inline-flex h-12 items-center gap-2 rounded-sm border border-line-strong bg-transparent px-6 text-body font-semibold text-ink transition-colors duration-instant hover:bg-paper-deep/70"
              >
                {text(secondaryCtaLabel)}
              </Link>
            </motion.div>

            <motion.ul {...fade(0.54)} className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-line pt-6">
              {trustPoints.map(({ icon: IconComponent, label }) => (
                <li key={label.ar} className="flex items-center gap-2 text-body-sm font-medium text-ink-soft">
                  <IconComponent size={16} strokeWidth={1.75} className="text-brand" aria-hidden="true" />
                  {text(label)}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* visual composition — real products, layered */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.6, delay: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-[560px] lg:me-0"
          >
            {/* back sheet */}
            <Parallax factor={0.05}>
              <div
                className={cn(
                  "absolute -top-5 -end-5 hidden h-full w-full rounded-md border border-line bg-paper-deep/70 sm:block"
                )}
              />
            </Parallax>

            {/* primary cover */}
            {primary ? (
              <Link
                href={`/products/${primary.slug}`}
                className="card relative block overflow-hidden outline-none focus-visible:-order-1"
                aria-label={primary.title}
              >
                <ProductCover
                  title={primary.title}
                  subject={primary.subject}
                  category={primary.category}
                  format={primary.format}
                  coverImage={primary.coverImage}
                  additionalImages={primary.additionalImages}
                  discountPercent={
                    primary.compareAt && primary.compareAt > primary.price
                      ? Math.round(((primary.compareAt - primary.price) / primary.compareAt) * 100)
                      : null
                  }
                  sharedElementName={`product-cover-${primary.slug}`}
                  priority
                  className="h-full"
                />
                <div className="flex items-center justify-between gap-3 border-t border-line bg-surface px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-caption text-ink-faint">
                      {primary.grade} · {primary.subject}
                    </p>
                    <p className="truncate text-h4 font-bold text-ink">{primary.title}</p>
                  </div>
                  <span className="tnum shrink-0 text-price font-bold text-brand-deep" dir="ltr">
                    {currencyLabel(primary.price)}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="card aspect-[4/3] grid place-items-center bg-paper-deep/60">
                <p className="text-body-sm text-ink-faint">{text({ ar: "أضف منتجات من لوحة الإدارة", en: "Add products from the admin panel" })}</p>
              </div>
            )}

            {/* secondary covers */}
            <div className="mt-5 grid grid-cols-2 gap-5">
              {[secondary, tertiary].map((product) =>
                product ? (
                  <Link
                    key={product.slug}
                    href={`/products/${product.slug}`}
                    className="card group block overflow-hidden outline-none"
                    aria-label={product.title}
                  >
                    <ProductCover
                      title={product.title}
                      subject={product.subject}
                      category={product.category}
                      format={product.format}
                      coverImage={product.coverImage}
                      additionalImages={product.additionalImages}
                      showBadges={false}
                      priority={false}
                      className="transition-transform duration-normal ease-standard group-hover:scale-[1.015]"
                    />
                    <div className="truncate px-4 py-3 text-caption font-semibold text-ink-soft">
                      {product.title}
                    </div>
                  </Link>
                ) : null
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
