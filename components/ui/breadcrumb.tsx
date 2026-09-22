import Link from "next/link";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };

/**
 * KUTUBI Breadcrumbs — logical direction (no manual mirroring).
 * `·` separator, last crumb = current (strong).
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-ink-faint">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">·</span> : null}
              {item.href && !last ? (
                <Link href={item.href} className="transition-colors duration-instant hover:text-brand">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn(last && "font-semibold text-ink")}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
