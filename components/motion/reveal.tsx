"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** stagger index when inside <Stagger> */
  index?: number;
  /** extra delay in seconds (used by hero choreography) */
  delay?: number;
  as?: "div" | "section" | "article" | "li" | "span";
};

/**
 * Fade + rise on viewport entry. once-only, 14px, 400ms, enter easing.
 * reduced-motion → opacity only, no delay.
 */
export function Reveal({ children, className, index, delay = 0, as: Tag = "div" }: RevealProps) {
  const reduced = useReducedMotion() ?? false;
  const MotionTag = motion[Tag];

  return (
    <MotionTag
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: reduced ? 0.01 : 0.4,
        delay: reduced ? 0 : (index ?? 0) * 0.05 + delay,
        ease: [0.16, 1, 0.3, 1]
      }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Stagger wrapper: children <Reveal> get sequential delays via index.
 * (Use index prop on children, cap visual stagger at ~5 items.)
 */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>;
}

/** Simple fade for overlays/backdrops (180ms). */
export function FadeIn({
  children,
  className,
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0.01 : 0.18, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
