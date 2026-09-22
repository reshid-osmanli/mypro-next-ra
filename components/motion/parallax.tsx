"use client";

import { useEffect, useRef } from "react";
import { useMotionPrefs } from "@/components/motion/use-motion-prefs";

/**
 * Tiny parallax — moves the element by scrollY * factor using rAF.
 * Desktop (fine pointer) only; disabled for reduced motion.
 * factor ≈ 0.05–0.1 (spec: background slow, main medium).
 */
export function Parallax({
  factor = 0.07,
  children,
  className
}: {
  factor?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, finePointer } = useMotionPrefs();
  const enabled = finePointer && !reduced;

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    function update() {
      if (!el) return;
      const rect = el.parentElement?.getBoundingClientRect();
      const offset = rect ? rect.top + rect.height / 2 - window.innerHeight / 2 : 0;
      el.style.transform = `translate3d(0, ${(-offset * factor).toFixed(1)}px, 0)`;
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      el.style.transform = "";
    };
  }, [enabled, factor]);

  return (
    <div ref={ref} className={className} aria-hidden="true" style={enabled ? { willChange: "transform" } : undefined}>
      {children}
    </div>
  );
}
