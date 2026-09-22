"use client";

import { useEffect, useState } from "react";

export type MotionPrefs = {
  /** prefers-reduced-motion: reduce */
  reduced: boolean;
  /** fine pointer device (desktop) — hover enhancements only */
  finePointer: boolean;
};

function readPrefs(): MotionPrefs {
  if (typeof window === "undefined") {
    return { reduced: false, finePointer: false };
  }
  return {
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    finePointer: window.matchMedia("(hover: hover) and (pointer: fine)").matches
  };
}

/**
 * Central motion policy — the ONLY place reduced-motion + pointer are read.
 * Every motion primitive must go through this. (ANIMATION_SYSTEM.md §7)
 */
export function useMotionPrefs(): MotionPrefs {
  const [prefs, setPrefs] = useState<MotionPrefs>(readPrefs);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () =>
      setPrefs({
        reduced: motionQuery.matches,
        finePointer: pointerQuery.matches
      });
    motionQuery.addEventListener("change", update);
    pointerQuery.addEventListener("change", update);
    return () => {
      motionQuery.removeEventListener("change", update);
      pointerQuery.removeEventListener("change", update);
    };
  }, []);

  return prefs;
}

/** Shared framer-motion values that respect the policy. */
export function revealVariants(reduced: boolean) {
  return {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 14 },
    visible: (i: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: reduced ? 0.01 : 0.4,
        delay: reduced ? 0 : i * 0.05,
        ease: [0.16, 1, 0.3, 1] as const
      }
    })
  };
}
