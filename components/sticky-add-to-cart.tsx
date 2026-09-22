"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Price } from "@/components/ui/price";
import { useSitePreferences } from "@/components/site-preferences";

type Props = {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    compareAt?: number | null;
    grade: string;
    subject: string;
    badge: string;
    format: string;
    accentA: string;
    accentB: string;
    coverImage?: string | null;
  };
  /** scroll offset (px) where the bar appears */
  threshold?: number;
};

/**
 * Mobile sticky CTA bar — appears after scrolling past the main CTA.
 * Solid surface (no glass), price + add button.
 */
export function StickyAddToCart({ product, threshold = 560 }: Props) {
  const [visible, setVisible] = useState(false);
  const { text } = useSitePreferences();
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    let ticking = false;
    function handleScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setVisible(window.scrollY > threshold);
        ticking = false;
      });
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduced ? false : { y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? undefined : { y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 34 }}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper px-4 py-3 md:hidden"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-bold text-ink">{product.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-caption text-ink-faint">
                <ShieldCheck size={12} aria-hidden="true" />
                {text({ ar: "تحميل آمن بعد الدفع", en: "Secure download after payment" })}
              </p>
            </div>
            <Price value={product.price} compareAt={product.compareAt} size="sm" />
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
                coverImage: product.coverImage ?? null
              }}
              size="sm"
              className="h-11 shrink-0"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
