"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subject: string;
  category: string;
  format: string;
  /** all preview images (cover first) */
  images: string[];
  /** shared-element view transition name (must match the card's cover) */
  sharedElementName?: string;
};

/**
 * KUTUBI product page gallery.
 * Main frame (shared element for View Transitions) + thumbnail strip.
 * Lightbox: full-screen, keyboard (Esc / arrows), quiet watermark.
 */
export function ProductPageGallery({ title, subject, format, images, sharedElementName }: Props) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const all = images.filter(Boolean);
  const thumbnails = all.slice(0, 5);
  const count = Math.max(1, all.length);

  function go(delta: number) {
    setActive((prev) => (prev + delta + count) % count);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setActive((prev) => (prev + 1) % count);
      if (e.key === "ArrowLeft") setActive((prev) => (prev - 1 + count) % count);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, count]);

  if (all.length === 0) {
    return (
      <div
        className="card flex min-h-[26rem] flex-col justify-between overflow-hidden p-6"
        style={sharedElementName ? { viewTransitionName: sharedElementName } : undefined}
      >
        <span className="tnum w-fit rounded-pill border border-line bg-surface px-3 py-1 text-caption font-semibold text-ink-soft">
          {format}
        </span>
        <div>
          <p className="text-caption font-semibold text-ink-faint">{subject}</p>
          <h2 className="mt-2 text-h2 font-bold leading-snug text-ink">{title}</h2>
        </div>
        <div className="h-px bg-line" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div>
      {/* main frame — the shared element for card → page transitions */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-sm border border-line bg-paper-deep/50 outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        aria-label={all.length > 1 ? "عرض الصور بالحجم الكامل" : "عرض الصورة بالحجم الكامل"}
        style={sharedElementName ? { viewTransitionName: sharedElementName } : undefined}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={all[active]}
            src={all[active]}
            alt={`${title} — صورة ${active + 1} من ${all.length}`}
            initial={reduced ? { opacity: 1 } : { opacity: 0.4 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="h-full w-full object-contain p-5 transition-transform duration-normal ease-standard group-hover:scale-[1.015]"
          />
        </AnimatePresence>
        {all.length > 1 ? (
          <span className="tnum absolute bottom-3 end-3 rounded-pill bg-ink/80 px-2.5 py-1 text-caption font-semibold text-paper">
            {active + 1} / {all.length}
          </span>
        ) : null}
      </button>

      {/* thumbnails */}
      {thumbnails.length > 1 ? (
        <div className="mt-3 grid grid-cols-5 gap-2.5">
          {thumbnails.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`صورة ${index + 1}`}
              aria-pressed={index === active}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-sm border bg-paper-deep/40 transition-colors duration-instant",
                index === active ? "border-brand ring-1 ring-brand/30" : "border-line hover:border-line-strong"
              )}
            >
              <Image src={image} alt="" fill sizes="100px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      ) : null}

      {/* lightbox */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/95"
            role="dialog"
            aria-modal="true"
            aria-label={`${title} — معاينة`}
            onClick={() => setOpen(false)}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 end-4 z-10 grid size-10 place-items-center rounded-pill border border-white/20 bg-white/10 text-white transition-colors duration-instant hover:bg-white/20"
              aria-label="إغلاق"
            >
              <X size={18} aria-hidden="true" />
            </button>

            {all.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); go(-1); }}
                  className="absolute start-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-pill border border-white/20 bg-white/10 text-white transition-colors duration-instant hover:bg-white/20 sm:start-6"
                  aria-label="السابق"
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); go(1); }}
                  className="absolute end-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-pill border border-white/20 bg-white/10 text-white transition-colors duration-instant hover:bg-white/20 sm:end-6"
                  aria-label="التالي"
                >
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              </>
            ) : null}

            <div className="relative max-h-[88vh] max-w-[92vw] overflow-hidden rounded-sm" onClick={(e) => e.stopPropagation()}>
              {/* quiet watermark — preview protection */}
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-[0.07]" aria-hidden="true">
                <span className="-rotate-[28deg] whitespace-nowrap text-6xl font-bold tracking-[0.35em] text-white">K U T U B I</span>
              </div>
              <motion.img
                key={all[active]}
                src={all[active]}
                alt={`${title} — ${active + 1} / ${all.length}`}
                initial={reduced ? { opacity: 1 } : { opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.18 }}
                className="max-h-[88vh] w-auto max-w-full object-contain"
              />
            </div>

            <p className="tnum absolute bottom-5 start-1/2 -translate-x-1/2 rounded-pill bg-white/10 px-3.5 py-1.5 text-caption font-semibold text-white rtl:translate-x-1/2">
              {active + 1} / {all.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
