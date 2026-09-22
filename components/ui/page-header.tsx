"use client";

import type { LocalizedTextValue } from "@/components/site-preferences";
import { useSitePreferences } from "@/components/site-preferences";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

type Crumb = { label: string | LocalizedTextValue; href?: string };

type Props = {
  eyebrow: LocalizedTextValue;
  title: LocalizedTextValue;
  description?: LocalizedTextValue;
  crumbs?: Crumb[];
  className?: string;
};

/**
 * KUTUBI page header — breadcrumb + eyebrow + h1 + description.
 * Used for store/utility pages (products, cart, blog…).
 */
export function PageHeader({ eyebrow, title, description, crumbs, className }: Props) {
  const { text } = useSitePreferences();

  return (
    <div className={cn("border-b border-line bg-paper", className)}>
      <div className="container-content py-10 md:py-12">
        {crumbs ? (
          <Breadcrumbs
            items={crumbs.map((crumb) => ({ label: text(crumb.label), href: crumb.href }))}
            className="mb-6"
          />
        ) : null}
        <p className="flex items-center gap-2.5 text-label font-bold text-brand-deep">
          <span className="h-px w-7 bg-brand" aria-hidden="true" />
          {text(eyebrow)}
        </p>
        <h1 className="mt-3 text-h1 font-bold tracking-[-0.005em] text-ink">{text(title)}</h1>
        {description ? (
          <p className="mt-3 max-w-[40rem] text-body leading-8 text-ink-soft">{text(description)}</p>
        ) : null}
      </div>
    </div>
  );
}
