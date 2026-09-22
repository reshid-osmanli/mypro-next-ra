"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, SearchX, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSitePreferences } from "@/components/site-preferences";
import { cn } from "@/lib/utils";

type SearchHit = {
  slug: string;
  title: string;
  grade: string;
  subject: string;
  format: string;
  priceLabel: string;
  coverImage: string | null;
};

const RECENT_KEY = "kutubi-recent-searches";

/**
 * KUTUBI Search — overlay with instant results, recent searches,
 * full keyboard support. No result delay: first paint is immediate.
 */
export function SearchOverlay({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { text, direction } = useSitePreferences();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recents, setRecents] = useState<string[]>([]);
  const requestRef = useRef(0);

  // load recents
  useEffect(() => {
    if (!open) return;
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
      if (Array.isArray(stored)) setRecents(stored.slice(0, 5));
    } catch {
      setRecents([]);
    }
  }, [open]);

  // focus + esc
  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 30);
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // reset when closed
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setStatus("idle");
      setActiveIndex(-1);
    }
  }, [open]);

  // instant search, 200ms debounce
  useEffect(() => {
    const id = ++requestRef.current;
    const q = query.trim();
    if (!q) {
      setResults([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok || requestRef.current !== id) return;
        const data = (await res.json()) as { results: SearchHit[] };
        setResults(data.results);
        setStatus("done");
      } catch {
        if (requestRef.current === id) setStatus("done");
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  const go = useCallback(
    (slug: string) => {
      const q = query.trim();
      if (q) {
        const next = [q, ...recents.filter((item) => item !== q)].slice(0, 5);
        setRecents(next);
        try {
          localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        } catch {
          /* storage full — ignore */
        }
      }
      onClose();
      router.push(`/products/${slug}`);
    },
    [query, recents, onClose, router]
  );

  const showRecents = !query.trim() && recents.length > 0;
  const rows = results;

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(rows.length - 1, current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(-1, current - 1));
    } else if (event.key === "Enter" && activeIndex >= 0 && rows[activeIndex]) {
      event.preventDefault();
      go(rows[activeIndex].slug);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={text({ ar: "بحث", en: "Search" })}>
          {/* backdrop */}
          <motion.button
            type="button"
            aria-label={text({ ar: "إغلاق البحث", en: "Close search" })}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 w-full cursor-default bg-ink/40 backdrop-blur-[3px]"
          />
          {/* panel */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto mt-[8vh] w-[min(680px,calc(100vw-32px))] overflow-hidden rounded-lg border border-line bg-surface shadow-pop"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={18} strokeWidth={1.75} className="shrink-0 text-ink-faint" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(-1);
                }}
                onKeyDown={onKeyDown}
                placeholder={text({ ar: "ابحث عن منتج، صف، أو مادة…", en: "Search products, grades, subjects…" })}
                className="h-14 w-full bg-transparent text-body outline-none placeholder:text-ink-faint"
                aria-label={text({ ar: "بحث", en: "Search" })}
              />
              <button
                type="button"
                onClick={onClose}
                className="grid size-8 shrink-0 place-items-center rounded-sm text-ink-faint transition-colors duration-instant hover:bg-paper-deep hover:text-ink"
                aria-label={text({ ar: "إغلاق", en: "Close" })}
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-2">
              {showRecents ? (
                <div className="p-2">
                  <p className="px-2 pb-2 text-label font-semibold text-ink-faint">
                    {text({ ar: "عمليات بحث سابقة", en: "Recent searches" })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recents.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setQuery(item)}
                        className="rounded-pill border border-line bg-paper-deep/50 px-3.5 py-1.5 text-body-sm text-ink-soft transition-colors duration-instant hover:border-line-strong hover:text-ink"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {query.trim() && status === "loading" ? (
                <div className="space-y-1 p-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="skeleton h-12 w-full rounded-sm" />
                  ))}
                </div>
              ) : null}

              {status === "done" && rows.length === 0 && query.trim() ? (
                <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                  <SearchX size={22} strokeWidth={1.75} className="text-ink-faint" aria-hidden="true" />
                  <p className="text-body-sm text-ink-soft">
                    {text({ ar: "لا نتائج مطابقة لبحثك", en: "No matches for your search" })}
                  </p>
                </div>
              ) : null}

              <ul className="space-y-0.5">
                {rows.map((row, index) => (
                  <li key={row.slug}>
                    <button
                      type="button"
                      onClick={() => go(row.slug)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-sm px-2.5 py-2.5 text-start transition-colors duration-instant",
                        activeIndex === index ? "bg-paper-deep/70" : "hover:bg-paper-deep/50"
                      )}
                    >
                      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-sm bg-paper-deep">
                        {row.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <Search size={14} strokeWidth={1.75} className="text-ink-faint" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-sm font-semibold text-ink">{row.title}</span>
                        <span className="mt-0.5 block truncate text-caption text-ink-faint">
                          {row.grade} · {row.subject} · {row.format}
                        </span>
                      </span>
                      <span className="tnum shrink-0 text-body-sm font-bold text-brand-deep" dir="ltr">
                        {row.priceLabel}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {rows.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
                  }}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-sm px-3 py-2.5 text-body-sm font-semibold text-ink-soft transition-colors duration-instant hover:bg-paper-deep/60 hover:text-ink"
                >
                  {text({ ar: "عرض كل النتائج في المتجر", en: "View all results in the store" })}
                </button>
              ) : null}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
