"use client";

import Link from "next/link";
import { FileCheck2, PackagePlus, Trash2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCart } from "@/components/cart-provider";
import { AddToCartButton } from "@/components/add-to-cart-button";
import type { ProductCardModel } from "@/components/product-card";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ShoppingCart } from "lucide-react";
import { useSitePreferences } from "@/components/site-preferences";
import { subtotal } from "@/lib/site-math";
import { calculateBundleDiscount, bundleDiscountLabel } from "@/lib/bundle-discounts";
import { currencyLabel } from "@/lib/utils";

export function CartClient({ products = [] }: { products?: ProductCardModel[] }) {
  const { items, removeItem } = useCart();
  const { text } = useSitePreferences();
  const reduced = useReducedMotion() ?? false;
  const total = subtotal(items);
  const bundleDiscount = calculateBundleDiscount(items);
  const finalTotal = Math.max(0, total - bundleDiscount.discount);
  const cartSlugs = new Set(items.map((item) => item.slug));
  const primaryItem = items[0];
  const upsells = products
    .filter((product) => !cartSlugs.has(product.slug))
    .filter((product) => !primaryItem || (product.grade === primaryItem.grade && product.subject === primaryItem.subject))
    .slice(0, 3);

  if (!items.length) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title={text({ ar: "سلتك فارغة", en: "Your cart is empty" })}
        description={text({
          ar: "أضف عروضًا وأوراق عمل من المتجر لتظهر هنا قبل الدفع.",
          en: "Add decks and worksheets from the store and they will appear here before checkout."
        })}
        action={
          <Button href="/products" variant="primary" size="md">
            {text({ ar: "تصفح المنتجات", en: "Browse products" })}
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* items */}
      <div className="space-y-4">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.slug}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.98 }}
              transition={{ duration: reduced ? 0 : 0.22 }}
              className="card flex flex-wrap items-center gap-4 p-4 md:p-5"
            >
              <Link href={`/products/${item.slug}`} className="block h-20 w-16 shrink-0 overflow-hidden rounded-sm border border-line bg-paper-deep/50">
                {item.coverImage ? (
                  <img src={item.coverImage} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-caption font-semibold text-ink-faint">PDF</span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-h4 font-bold text-ink">
                  <Link href={`/products/${item.slug}`} className="transition-colors duration-instant hover:text-brand-deep">
                    {item.title}
                  </Link>
                </h3>
                <p className="mt-1 text-caption text-ink-faint">
                  {item.grade} · {item.subject} · {item.badge}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-caption font-medium text-teal-700">
                  <FileCheck2 size={13} aria-hidden="true" />
                  {text({ ar: "نسخة رقمية واحدة", en: "One digital copy" })}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Price value={item.price} size="sm" />
                <button
                  type="button"
                  onClick={() => removeItem(item.slug)}
                  className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-body-sm font-semibold text-ink-faint transition-colors duration-instant hover:bg-accent-danger-soft hover:text-accent-danger"
                >
                  <Trash2 size={15} aria-hidden="true" />
                  {text({ ar: "حذف", en: "Remove" })}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* bundle upsell */}
        {upsells.length ? (
          <div className="rounded-sm border border-brand/15 bg-brand-soft/40 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-sm border border-brand/20 bg-surface text-brand">
                <PackagePlus size={17} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-h4 font-bold text-ink">
                  {text({ ar: "أكمل حقيبة الفصل بخصم تلقائي", en: "Complete the bundle for an automatic discount" })}
                </h3>
                <p className="mt-1 text-body-sm leading-8 text-ink-soft">
                  {text({
                    ar: "منتجات من نفس الصف والمادة. عند وصول السلة إلى 3 منتجات أو أكثر يُطبق خصم الحقيبة تلقائيًا.",
                    en: "Products from the same grade and subject. Add 3 or more and the bundle discount applies automatically."
                  })}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2.5">
              {upsells.map((product) => {
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
                return (
                  <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line bg-surface px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-semibold text-ink">{product.title}</p>
                      <p className="mt-0.5 text-caption text-ink-faint">
                        {product.grade} · {product.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Price value={product.price} size="sm" />
                      <AddToCartButton item={cartItem} size="sm" className="h-9" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* summary */}
      <aside className="card h-fit p-6">
        <h2 className="text-h4 font-bold text-ink">{text({ ar: "ملخص الطلب", en: "Order summary" })}</h2>

        <dl className="mt-5 space-y-3 text-body-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-soft">{text({ ar: "المجموع", en: "Subtotal" })}</dt>
            <dd className="tnum font-semibold text-ink">{currencyLabel(total)}</dd>
          </div>
          {bundleDiscount.discount ? (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-soft">{bundleDiscountLabel()}</dt>
              <dd className="tnum font-semibold text-teal-700">-{currencyLabel(bundleDiscount.discount)}</dd>
            </div>
          ) : null}
          <div className="flex items-end justify-between gap-4 border-t border-line pt-3.5">
            <dt className="text-body font-bold text-ink">{text({ ar: "الإجمالي", en: "Total" })}</dt>
            <dd>
              <Price value={finalTotal} size="lg" />
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-caption leading-7 text-ink-faint">
          {text({
            ar: "كل منتج رقمي يضاف مرة واحدة فقط. راجع السلة ثم انتقل إلى الدفع.",
            en: "Each digital product is added once only. Review the cart, then proceed to payment."
          })}
        </p>

        <Button href="/checkout" variant="primary" size="lg" className="mt-5 w-full">
          {text({ ar: "متابعة إلى الدفع", en: "Continue to checkout" })}
        </Button>
        <Link
          href="/products"
          className="mt-3 block text-center text-body-sm font-semibold text-ink-soft transition-colors duration-instant hover:text-brand-deep"
        >
          {text({ ar: "متابعة التسوق", en: "Continue shopping" })}
        </Link>
      </aside>
    </div>
  );
}
