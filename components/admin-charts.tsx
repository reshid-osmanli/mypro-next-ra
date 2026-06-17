"use client";

// ============================================================================
// components/admin-charts.tsx — Lightweight chart components (no chart lib)
// ----------------------------------------------------------------------------
// New file: /components/admin-charts.tsx
// Hand-rolled SVG charts so we don't need to install recharts/chartjs.
// Drop-in into the admin dashboard tabs.
// ============================================================================

import { useState } from "react";

type Series = Array<{ label: string; revenue: number; orders: number }>;

function fmt(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export function SalesBarChart({ data, title = "المبيعات اليومية" }: { data: Series; title?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const width = 100 / Math.max(data.length, 1);

  return (
    <div className="rounded-2xl border border-pearl-200 bg-white p-5">
      <header className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-black text-zinc-950">{title}</h3>
        <span className="text-xs text-zinc-500">آخر {data.length} يوم</span>
      </header>
      <div className="relative h-48">
        <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          {data.map((d, i) => {
            const h = (d.revenue / max) * 45;
            const x = i * width;
            const isHover = hover === i;
            return (
              <g key={`${d.label}-${i}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <rect
                  x={x + width * 0.15}
                  y={50 - h}
                  width={width * 0.7}
                  height={h}
                  rx={0.6}
                  fill={isHover ? "#5b1027" : "#8a1538"}
                  opacity={isHover ? 1 : 0.85}
                />
                {isHover && (
                  <g>
                    <rect x={x + width * 0.15} y={50 - h - 7} width={Math.max(8, width)} height={5} rx={0.5} fill="#0f172a" />
                    <text x={x + width * 0.5} y={50 - h - 4} fontSize="2.5" textAnchor="middle" fill="#fff" fontWeight="700">
                      {fmt(d.revenue)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-bold text-zinc-500">
        {data.length > 0 && (
          <>
            <span>{data[0]?.label}</span>
            <span>{data[Math.floor(data.length / 2)]?.label}</span>
            <span>{data[data.length - 1]?.label}</span>
          </>
        )}
      </div>
    </div>
  );
}

export function SalesLineChart({ data, title = "المبيعات الشهرية" }: { data: Series; title?: string }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 100;
    const y = 50 - (d.revenue / max) * 45;
    return `${x},${y}`;
  });
  const path = `M ${points.join(" L ")}`;

  return (
    <div className="rounded-2xl border border-pearl-200 bg-white p-5">
      <header className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-black text-zinc-950">{title}</h3>
        <span className="text-xs text-zinc-500">آخر {data.length} شهر</span>
      </header>
      <div className="relative h-48">
        <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="adminLineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L 100,50 L 0,50 Z`} fill="url(#adminLineFill)" />
          <path d={path} stroke="#0f766e" strokeWidth="0.6" fill="none" strokeLinecap="round" />
          {data.map((d, i) => {
            const x = (i / Math.max(data.length - 1, 1)) * 100;
            const y = 50 - (d.revenue / max) * 45;
            return <circle key={i} cx={x} cy={y} r="0.8" fill="#0f766e" />;
          })}
        </svg>
      </div>
    </div>
  );
}

export function ConversionRateCard({ paid, total }: { paid: number; total: number }) {
  const rate = total > 0 ? (paid / total) * 100 : 0;
  return (
    <div className="rounded-2xl border border-pearl-200 bg-white p-5">
      <p className="text-xs font-bold text-zinc-600">معدل التحويل</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-black text-qatar-800">{rate.toFixed(1)}</span>
        <span className="text-sm font-bold text-zinc-600">%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-pearl-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-qatar-600 to-qatar-800"
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-zinc-500">{paid} من {total} طلب</p>
    </div>
  );
}

export function TopProductsList({ items }: { items: Array<{ title: string; quantity: number; revenue: number }> }) {
  return (
    <div className="rounded-2xl border border-pearl-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-black text-zinc-950">أكثر المنتجات مبيعاً</h3>
      <ol className="space-y-3">
        {items.slice(0, 6).map((item, i) => (
          <li key={item.title} className="flex items-center gap-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
              i === 0 ? "bg-amber-100 text-amber-800" :
              i === 1 ? "bg-zinc-200 text-zinc-700" :
              i === 2 ? "bg-orange-100 text-orange-700" :
              "bg-pearl-100 text-zinc-600"
            }`}>{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-zinc-800">{item.title}</p>
              <p className="text-xs text-zinc-500">{item.quantity} نسخة</p>
            </div>
            <span className="text-sm font-black text-qatar-800">{(item.revenue / 100).toFixed(2)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
