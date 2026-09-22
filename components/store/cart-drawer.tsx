"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ShoppingBag, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart-provider";
import { useSitePreferences } from "@/components/site-preferences";
import { subtotal } from "@/lib/site-math";
import { calculateBundleDiscount } from "@/lib/bundle-discounts";
import { currencyLabel } from "@/lib/utils";

/**
 * KUTUBI Cart drawer — end-side (left in RTL / right in LTR).
 * Spring enter, backdrop, Esc, scroll lock (handled by provider).
 */
export function CartDrawer() {
  const { items, removeItem, isDrawerOpen, closeDrawer } = useCart();
  const { text, direction } = useSitePreferences();
  const reduced = useReducedMotion() ?? false;
  const panelRef = useRef<HTMLDivElement>(null);

  const total = subtotal(items);
  const bundleDiscount = calculateBundleDiscount(items);
  const finalTotal = Math.max(0, total - bundleDiscount.discount);
  const fromSide = direction === "rtl" ? "-100%" : "100%";

  // Esc to close + move focus
  useEffect(() => {
    if (!isDrawerOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 40);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [isDrawerOpen, closeDrawer]);

  const Arrow = direction === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <AnimatePresence>
      {isDrawerOpen ? (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={text({ ar: "سلة المشتريات", en: "Cart" })}>
          <motion.button
            type="button"
            aria-label={text({ ar: "إغلاق السلة", en: "Close cart" })}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
            className="absolute inset-0 w-full cursor-default bg-ink/40 backdrop-blur-[3px]"
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ x: fromSide, opacity: reduced ? 1 : 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: fromSide, opacity: reduced ? 1 : 0.4 }}
            transition={reduced ? { duration: 0.01 } : { type: "spring", stiffness: 340, damping: 34 }}
            className="absolute inset-y-0 flex w-full max-w-[420px] flex-col border-line bg-surface shadow-pop outline-none data-[side=right]:inset-inline-end-0 data-[side=right]:border-s data-[side=left]:inset-inline-start-0 data-[side=left]:border-e"
            data-side={direction === "rtl" ? "left" : "right"}
          >
            {/* head */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2.5 text-h3 font-bold text-ink">
                <ShoppingBag size={18} strokeWidth={1.75} className="text-brand" aria-hidden="true" />
                {text({ ar: "سلة المشتريات", en: "Your cart" })}
                <span className="text-body-sm font-semibold text-ink-faint">({items.length})</span>
              </h2>
              <button
                type="button"
                onClick={closeDrawer}
                className="grid size-9 place-items-center rounded-sm text-ink-faint transition-colors duration-instant hover:bg-paper-deep hover:text-ink"
                aria-label={text({ ar: "إغلاق", en: "Close" })}
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <span className="grid size-14 place-items-center rounded-pill border border-line bg-paper-deep/60 text-brand">
                  <ShoppingBag size={22} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-h4 font-bold text-ink">
                    {text({ ar: "سلتك فارغة", en: "Your cart is empty" })}
                  </p>
                  <p className="mt-1.5 text-body-sm text-ink-soft">
                    {text({ ar: "أضف عروضاً أو أوراق عمل وسترها هنا قبل الشراء.", en: "Add decks or worksheets and they will appear here." })}
                  </p>
                </div>
                <Link
                  href="/products"
                  onClick={closeDrawer}
                  className="inline-flex h-11 items-center gap-2 rounded-sm bg-brand px-5 text-body-sm font-semibold text-white transition-colors duration-instant hover:bg-brand-deep"
                >
                  {text({ ar: "تصفح المنتجات", en: "Browse products" })}
                </Link>
              </div>
            ) : (
              <>
                {/* items */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <motion.li
                        key={item.slug}
                        layout={!reduced}
                        initial={reduced ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-3"
                      >
                        <span className="grid size-[72px] shrink-0 place-items-center overflow-hidden rounded-sm border border-line bg-paper-deep">
                          {item.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <ShoppingBag size={18} strokeWidth={1.75} className="text-ink-faint" aria-hidden="true" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body-sm font-semibold text-ink">{item.title}</span>
                          <span className="mt-1 block text-caption text-ink-faint">
                            {item.grade} · {item.subject}
                          </span>
                          <span className="tnum mt-1.5 block text-body-sm font-bold text-brand-deep" dir="ltr">
                            {currencyLabel(item.price)}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.slug)}
                          className="grid size-8 shrink-0 place-items-center self-start rounded-sm text-ink-faint transition-colors duration-instant hover:bg-accent-danger-soft hover:text-accent-danger"
                          aria-label={text({ ar: `حذف ${item.title}`, en: `Remove ${item.title}` })}
                        >
                          <Trash2 size={15} strokeWidth={1.75} />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* summary */}
                <div className="space-y-3 border-t border-line px-5 py-4">
                  <div className="flex items-center justify-between text-body-sm text-ink-soft">
                    <span>{text({ ar: "المجموع الفرعي", en: "Subtotal" })}</span>
                    <span className="tnum" dir="ltr">{currencyLabel(total)}</span>
                  </div>
                  {bundleDiscount.discount > 0 ? (
                    <div className="flex items-center justify-between text-body-sm text-accent-teal">
                      <span>{text({ ar: "خصم الحقيبة", en: "Bundle discount" })}</span>
                      <span className="tnum" dir="ltr">−{currencyLabel(bundleDiscount.discount)}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between border-t border-line pt-3">
                    <span className="text-h4 font-bold text-ink">{text({ ar: "الإجمالي", en: "Total" })}</span>
                    <span className="tnum text-price font-bold text-brand-deep" dir="ltr">
                      {currencyLabel(finalTotal)}
                    </span>
                  </div>
                  <div className="grid gap-2 pt-1">
                    <Link
                      href="/checkout"
                      onClick={closeDrawer}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-brand text-body-sm font-semibold text-white transition-colors duration-instant hover:bg-brand-deep"
                    >
                      {text({ ar: "إتمام الشراء", en: "Proceed to checkout" })}
                      <Arrow size={16} strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                    <Link
                      href="/cart"
                      onClick={closeDrawer}
                      className="inline-flex h-11 items-center justify-center rounded-sm text-body-sm font-semibold text-ink-soft transition-colors duration-instant hover:bg-paper-deep hover:text-ink"
                    >
                      {text({ ar: "عرض السلة كاملة", en: "View full cart" })}
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
