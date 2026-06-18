"use client";

// ============================================================================
// components/page-transition.tsx — Wraps children with a soft fade/slide
// ----------------------------------------------------------------------------
// New file: /components/page-transition.tsx
// Use inside layout for a SPA-like transition on route changes.
// ============================================================================

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-[50vh]"
    >
      {children}
    </motion.div>
  );
}
