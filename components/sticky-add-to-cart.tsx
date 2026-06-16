"use client";

// ============================================================================
// components/sticky-add-to-cart.tsx — Mobile sticky CTA bar
// ----------------------------------------------------------------------------
// New file: /components/sticky-add-to-cart.tsx
// Appears after scrolling past the main CTA on product pages.
// ============================================================================

import { useEffect, useState } from "react";
import { ShoppingCart, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { currencyLabel } from "@/lib/utils";

type Props = {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    grade: string;
    subject: string;
    badge: string;
    format: string;
    accentA: string;
    accentB: string;
  };
  /** Scroll offset (in px) where the bar should appear */
  threshold?: number;
};

export function StickyAddToCart({ product, threshold = 600 }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > threshold);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-pearl-200 bg-white/95 px-4 py-3 backdrop-blur-md shadow-[0_-12px_30px_rgba(15,23,42,0.08)] md:hidden"
          dir="rtl"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-zinc-950">{product.title}</p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-600">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>تحميل آمن بعد الدفع</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-base font-black text-qatar-800">
                {currencyLabel(product.price)}
              </span>
            </div>
            <AddToCartButton
              item={{
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
              }}
              className="btn-primary !px-4 !py-2 !text-sm"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
