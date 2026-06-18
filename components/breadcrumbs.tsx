import Link from "next/link";

// ============================================================================
// components/breadcrumbs.tsx — Accessible breadcrumbs + JSON-LD
// ----------------------------------------------------------------------------
// New file: /components/breadcrumbs.tsx
// Renders BreadcrumbList schema for SEO and an accessible nav for users.
// ============================================================================

import { ChevronLeft } from "lucide-react";

export type Crumb = {
  href?: string;
  label: string;
};

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? new URL(item.href, "https://kutubi.example").toString() : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-1 text-zinc-600">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="rounded px-1 py-0.5 font-bold text-zinc-700 transition hover:text-qatar-700"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="rounded px-1 py-0.5 font-bold text-qatar-800"
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
                {!isLast && (
                  <ChevronLeft size={14} className="text-zinc-400 rtl:rotate-180" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
