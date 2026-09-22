import { currencyLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PriceProps = {
  value: number;
  compareAt?: number | null;
  /** price (lg) | inline (sm) | hero (xl) */
  size?: "sm" | "lg" | "xl";
  className?: string;
};

const sizes = {
  sm: { main: "text-h4", old: "text-caption" },
  lg: { main: "text-price", old: "text-body-sm" },
  xl: { main: "text-price-lg", old: "text-body" }
};

/**
 * KUTUBI Price — the most important number on the page.
 * LTR-isolated so "USD 49" never reorders in RTL.
 */
export function Price({ value, compareAt, size = "lg", className }: PriceProps) {
  const s = sizes[size];
  const hasDiscount = compareAt != null && compareAt > value;

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span
        dir="ltr"
        className={cn("tnum font-bold text-brand-deep", s.main)}
      >
        {currencyLabel(value)}
      </span>
      {hasDiscount ? (
        <span dir="ltr" className={cn("tnum text-ink-faint line-through", s.old)}>
          {currencyLabel(compareAt as number)}
        </span>
      ) : null}
    </div>
  );
}
