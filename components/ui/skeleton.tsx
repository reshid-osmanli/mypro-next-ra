import { cn } from "@/lib/utils";

/** Pulse placeholder (1.6s, subtle). Use shapes that mirror the real layout. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

/** Mirrors ProductCard exactly — zero layout shift on swap. */
export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
        <div className="border-t border-line pt-4">
          <div className="flex items-end justify-between">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="size-10 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LineSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4", className)} />;
}
