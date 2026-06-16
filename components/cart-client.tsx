"use client";

import Link from "next/link";
import { FileCheck2, PackagePlus, ShoppingCart, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "./cart-provider";
import { AddToCartButton } from "./add-to-cart-button";
import type { ProductCardModel } from "./product-card";
import { currencyLabel } from "@/lib/utils";
import { subtotal } from "@/lib/site-math";
import { calculateBundleDiscount, bundleDiscountLabel } from "@/lib/bundle-discounts";
import { useSitePreferences } from "./site-preferences";

export function CartClient({ products = [] }: { products?: ProductCardModel[] }) {
  const { items, removeItem } = useCart();
  const { text } = useSitePreferences();
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
      <div className="panel p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-qatar-50 text-qatar-700">
          <ShoppingCart size={28} />
        </div>
        <p className="mt-5 text-2xl font-black text-zinc-950">{text({ ar: "السلة فارغة حاليًا", en: "Your cart is empty" })}</p>
        <p className="mt-2 text-sm leading-7 text-zinc-600">
          {text({
            ar: "أضف منتجًا من صفحة المنتجات أو من صفحة المادة ثم عد لإتمام الطلب.",
            en: "Add a product from the store or a subject page, then return to checkout."
          })}
        </p>
        <Link href="/products" className="btn-primary mt-6">{text({ ar: "تصفح المنتجات", en: "Browse products" })}</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {items.map((item) => (
          <motion.div key={item.slug} layout className="panel p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-zinc-950">{item.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{item.grade} · {item.subject} · {item.badge}</p>
              </div>
              <button type="button" onClick={() => removeItem(item.slug)} className="inline-flex items-center gap-2 text-sm font-semibold text-qatar-700 transition hover:text-qatar-900">
                <Trash2 size={16} />
                {text({ ar: "حذف", en: "Remove" })}
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-md border border-qatar-100 bg-white px-3 py-2 text-sm font-bold text-zinc-700">
                <FileCheck2 size={16} className="text-emerald-700" />
                {text({ ar: "نسخة رقمية واحدة", en: "One digital copy" })}
              </div>
              <p className="text-2xl font-black text-qatar-800">{currencyLabel(item.price)}</p>
            </div>
          </motion.div>
        ))}

        {upsells.length ? (
          <div className="panel border-qatar-100 bg-qatar-50/60 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
            <div className="flex items-start gap-3">
              <PackagePlus size={22} className="mt-1 text-qatar-700" />
              <div>
                <h3 className="text-lg font-black text-zinc-950">{text({ ar: "أكمل حقيبة الفصل بخصم تلقائي", en: "Complete the bundle for an automatic discount" })}</h3>
                <p className="mt-1 text-sm leading-7 text-zinc-600">
                  {text({ ar: "هذه منتجات من نفس الصف والمادة. عند وصول السلة إلى 3 منتجات أو أكثر يطبق الموقع خصم الحقيبة تلقائيًا.", en: "These products match the same grade and subject. Add 3 or more to activate the bundle discount." })}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
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
                  accentB: product.accentB
                } as const;
                return (
                  <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3">
                    <div>
                      <p className="font-bold text-zinc-950">{product.title}</p>
                      <p className="text-xs text-zinc-500">{product.grade} · {product.subject} · {currencyLabel(product.price)}</p>
                    </div>
                    <AddToCartButton item={cartItem} compact />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="panel h-fit p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-semibold text-zinc-500">{text({ ar: "الإجمالي", en: "Total" })}</p>
        <p className="mt-2 text-4xl font-black text-qatar-800">{currencyLabel(finalTotal)}</p>
        {bundleDiscount.discount ? (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">
            {bundleDiscountLabel()}: -{currencyLabel(bundleDiscount.discount)}
          </div>
        ) : null}
        <p className="mt-3 text-sm leading-7 text-zinc-600">
          {text({
            ar: "كل منتج رقمي يضاف مرة واحدة فقط. راجع السلة ثم انتقل إلى صفحة الدفع.",
            en: "Each digital product is added once only. Review your cart, then continue to checkout."
          })}
        </p>
        <Link href="/checkout" className="btn-primary mt-6 w-full">
          {text({ ar: "متابعة إلى الدفع", en: "Continue to checkout" })}
        </Link>
      </div>
    </div>
  );
}
