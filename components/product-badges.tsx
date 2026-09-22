"use client";

// ============================================================================
// components/product-badges.tsx — Dynamic badges based on real data only
// ----------------------------------------------------------------------------
// - جديد (createdAt within 14 days)
// - خصم X% (compareAt > price)
// - الأكثر مبيعاً (salesCount > 10, when provided)
// - رائج (recentOrdersCount >= 5, when provided)
// ============================================================================

import { Crown, Percent, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSitePreferences } from "@/components/site-preferences";

type Props = {
  product: {
    salesCount?: number;
    createdAt?: Date | string;
    compareAt?: number | null;
    price: number;
    recentOrdersCount?: number;
  };
  className?: string;
};

function daysSince(date: Date | string | undefined) {
  if (!date) return Infinity;
  const ms = Date.now() - new Date(date).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

export function ProductBadges({ product, className = "" }: Props) {
  const { text } = useSitePreferences();
  const isNew = daysSince(product.createdAt) <= 14;
  const isBestseller = (product.salesCount ?? 0) > 10;
  const isTrending = (product.recentOrdersCount ?? 0) >= 5;
  const discountPct =
    product.compareAt && product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : 0;

  if (!isNew && !isBestseller && !isTrending && discountPct === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {isBestseller && (
        <Badge tone="gold">
          <Crown size={11} aria-hidden="true" />
          {text({ ar: "الأكثر مبيعاً", en: "Best seller" })}
        </Badge>
      )}
      {isNew && (
        <Badge tone="teal">
          <Sparkles size={11} aria-hidden="true" />
          {text({ ar: "جديد", en: "New" })}
        </Badge>
      )}
      {isTrending && !isBestseller && (
        <Badge tone="gold">{text({ ar: "رائج", en: "Trending" })}</Badge>
      )}
      {discountPct > 0 && (
        <Badge tone="brand">
          <Percent size={11} aria-hidden="true" />
          {text({ ar: "خصم", en: "Save" })} <span className="tnum" dir="ltr">{discountPct}%</span>
        </Badge>
      )}
    </div>
  );
}
