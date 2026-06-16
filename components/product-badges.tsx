// ============================================================================
// components/product-badges.tsx — Dynamic badges based on real data
// ----------------------------------------------------------------------------
// New file: /components/product-badges.tsx
// - الأكثر مبيعاً (when salesCount > 10)
// - جديد (when createdAt within 14 days)
// - خصم X% (when compareAt > price)
// - Trending (when recent orders count > 5)
// ============================================================================

import { Flame, Sparkles, Percent, Crown } from "lucide-react";

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
  const isNew = daysSince(product.createdAt) <= 14;
  const isBestseller = (product.salesCount ?? 0) > 10;
  const isTrending = (product.recentOrdersCount ?? 0) >= 5;
  const discountPct =
    product.compareAt && product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : 0;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {isBestseller && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800 shadow-sm">
          <Crown size={12} />
          الأكثر مبيعاً
        </span>
      )}
      {isNew && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800 shadow-sm">
          <Sparkles size={12} />
          جديد
        </span>
      )}
      {isTrending && !isBestseller && (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700 shadow-sm">
          <Flame size={12} />
          رائج
        </span>
      )}
      {discountPct > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-qatar-100 px-2.5 py-1 text-xs font-black text-qatar-800 shadow-sm">
          <Percent size={12} />
          خصم {discountPct}%
        </span>
      )}
    </div>
  );
}
