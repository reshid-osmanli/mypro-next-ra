"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Word-mask reveal — reserved for the Hero headline and major section titles.
 * Each word slides up inside an overflow-hidden mask, staggered 60ms.
 * reduced-motion → plain fade of the whole line.
 */
export function TextReveal({
  text,
  className,
  startDelay = 0.06,
  step = 0.06
}: {
  text: string;
  className?: string;
  startDelay?: number;
  step?: number;
}) {
  const reduced = useReducedMotion() ?? false;
  const words = text.split(" ");

  if (reduced) {
    return (
      <motion.span className={cn("block", className)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.01 }}>
        {text}
      </motion.span>
    );
  }

  return (
    <span className={cn("block", className)}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{
              duration: 0.45,
              delay: startDelay + i * step,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
