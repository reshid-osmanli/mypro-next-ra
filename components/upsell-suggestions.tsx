"use client";

// ============================================================================
// components/upsell-suggestions.tsx — Suggestion chips in cart/checkout
// ----------------------------------------------------------------------------
// New file: /components/upsell-suggestions.tsx
// ============================================================================

import { Sparkles, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { UpsellSuggestion } from "@/lib/upsell-suggestions";
import { currencyLabel } from "@/lib/utils";

export function UpsellSuggestions() {
  const { items, addItem } = useCart();
  const [suggestions, setSuggestions] = useState<UpsellSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!items.length) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch("/api/upsell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        items: items.map((i) => ({
          id: i.id,
          subject: i.subject,
          // @ts-expect-error - category is optional on CartItem but used for upsell rules
          category: i.category,
        }))
      }),
    })
      .then((r) => r.ok ? r.json() : { suggestions: [] })
      .then((data) => {
        if (!cancelled) setSuggestions(data.suggestions ?? []);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [items]);

  if (!suggestions.length && !loading) return null;

  return (
    <section className="rounded-2xl border border-pearl-200 bg-pearl-50/70 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={18} className="text-qatar-700" />
        <h3 className="text-base font-black text-zinc-950">قد يعجبك أيضاً</h3>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-pearl-200" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {suggestions.map((s) => (
            <article
              key={s.productId}
              className="flex items-center gap-3 rounded-lg border border-pearl-200 bg-white p-3 shadow-sm transition hover:border-qatar-300 hover:shadow-md"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-pearl-100">
                {s.coverImage ? (
                  <img src={s.coverImage} alt={s.title} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-bold text-zinc-700">{s.title}</p>
                <p className="mt-0.5 text-[11px] font-bold text-zinc-500">{s.reason}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-black text-qatar-800">{currencyLabel(s.price)}</span>
                  {s.discountPercent > 0 && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-700">
                      -{s.discountPercent}%
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  // Add upsell product to cart via API or context
                  fetch(`/api/products/${s.productId}/lite`)
                    .then((r) => r.ok ? r.json() : null)
                    .then((product) => {
                      if (!product) return;
                      addItem({
                        id: product.id,
                        slug: product.slug,
                        title: product.title,
                        price: s.price,
                        grade: product.grade,
                        subject: product.subject,
                        badge: product.badge,
                        format: product.format,
                        accentA: product.accentA,
                        accentB: product.accentB,
                      });
                    });
                }}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-qatar-700 text-white transition hover:bg-qatar-800"
                aria-label="أضِف إلى السلة"
              >
                <Plus size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
