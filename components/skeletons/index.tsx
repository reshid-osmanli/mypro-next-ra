// ============================================================================
// components/skeletons/index.tsx — All skeleton loaders in one file
// ----------------------------------------------------------------------------
// New file: /components/skeletons/index.tsx
// Use as drop-in replacements during loading states.
// ============================================================================

import { Loader2 } from "lucide-react";

function Pulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-pearl-200 ${className}`}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-pearl-200 bg-white p-4 shadow-sm">
      <Pulse className="h-48 w-full" />
      <div className="mt-4 space-y-2">
        <Pulse className="h-4 w-3/4" />
        <Pulse className="h-4 w-1/2" />
        <Pulse className="h-6 w-1/3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="overflow-hidden rounded-lg border border-pearl-200 bg-white">
        <div className="grid gap-0 lg:grid-cols-[0.98fr_1.02fr]">
          <Pulse className="h-[26rem] w-full" />
          <div className="space-y-4 p-10">
            <Pulse className="h-6 w-1/4" />
            <Pulse className="h-10 w-3/4" />
            <Pulse className="h-20 w-full" />
            <Pulse className="h-12 w-1/3" />
            <Pulse className="h-12 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <Pulse className="h-10 w-1/2" />
      <Pulse className="h-32 w-full" />
      <Pulse className="h-32 w-full" />
      <Pulse className="h-32 w-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <Pulse className="h-10 w-1/4" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse key={i} className="h-24 w-full" />
        ))}
      </div>
      <Pulse className="h-64 w-full" />
      <Pulse className="h-48 w-full" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <Pulse className="h-12 w-1/2" />
      <Pulse className="h-6 w-3/4" />
      <Pulse className="h-72 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-pearl-200 bg-white">
      <div className="grid gap-px bg-pearl-100" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Pulse key={`h${i}`} className="m-1 h-6" />
        ))}
        {Array.from({ length: rows * columns }).map((_, i) => (
          <Pulse key={`r${i}`} className="m-1 h-5" />
        ))}
      </div>
    </div>
  );
}

export function LoadingSpinner({ label = "جاري التحميل..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-600">
      <Loader2 size={18} className="animate-spin text-qatar-700" />
      <span>{label}</span>
    </div>
  );
}
