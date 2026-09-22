"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useSitePreferences } from "@/components/site-preferences";

/**
 * Lucide wrapper — one stroke weight for the whole site (1.75).
 * Sizes: 14 / 16 / 18 / 20 / 24 only.
 */
export function Icon({
  icon: IconComponent,
  size = 18,
  className
}: {
  icon: LucideIcon;
  size?: 14 | 16 | 18 | 20 | 24;
  className?: string;
}) {
  return <IconComponent size={size} strokeWidth={1.75} className={className} aria-hidden="true" />;
}

/**
 * Direction-aware "forward" arrow:
 * points left in RTL, right in LTR. Use for "continue/view" affordances.
 */
export function ArrowForward({
  size = 16,
  className
}: {
  size?: number;
  className?: string;
}) {
  const { direction } = useSitePreferences();
  const Cmp = direction === "rtl" ? ArrowLeft : ArrowRight;
  return <Cmp size={size} strokeWidth={1.75} className={className} aria-hidden="true" />;
}
