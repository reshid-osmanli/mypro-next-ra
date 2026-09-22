import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** compact = inline inside a panel; full = standalone page area */
  compact?: boolean;
};

/**
 * KUTUBI Empty / Error state — calm, clear, actionable.
 * One icon in a soft disc, one short title, one CTA.
 */
export function EmptyState({ icon: IconComponent, title, description, action, className, compact = false }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-3 py-10" : "gap-4 py-20",
        className
      )}
    >
      <div className="grid size-14 place-items-center rounded-pill border border-line bg-surface text-brand">
        <IconComponent size={22} strokeWidth={1.75} aria-hidden="true" />
      </div>
      <h3 className={cn("font-bold text-ink", compact ? "text-h4" : "text-h3")}>{title}</h3>
      {description ? (
        <p className="max-w-sm text-body-sm text-ink-soft">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
