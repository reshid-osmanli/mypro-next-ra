"use client";

import Link from "next/link";
import type { LocalizedTextValue } from "@/components/site-preferences";
import { useSitePreferences } from "@/components/site-preferences";
import { ArrowForward } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow: LocalizedTextValue;
  title: LocalizedTextValue;
  description?: LocalizedTextValue;
  /** optional "view all" action */
  action?: { href: string; label: LocalizedTextValue };
  center?: boolean;
  className?: string;
};

/** KUTUBI section heading — eyebrow + h2 (+ description + optional action). */
export function SectionHeading({ eyebrow, title, description, action, center = false, className }: Props) {
  const { text } = useSitePreferences();

  return (
    <div className={cn("mb-9 flex flex-wrap items-end justify-between gap-x-8 gap-y-4", center && "justify-center text-center", className)}>
      <div className={cn("max-w-[44rem]", center && "mx-auto")}>
        <p className="flex items-center gap-2.5 text-label font-bold text-brand-deep">
          {center ? null : <span className="h-px w-7 bg-brand" aria-hidden="true" />}
          {text(eyebrow)}
        </p>
        <h2 className="mt-3 text-h2 font-bold text-ink">{text(title)}</h2>
        {description ? (
          <p className="mt-3 max-w-[38rem] text-body text-ink-soft">{text(description)}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="group inline-flex items-center gap-2 text-body-sm font-semibold text-brand-deep transition-colors duration-instant hover:text-brand"
        >
          {text(action.label)}
          <ArrowForward size={15} className="transition-transform duration-fast ease-standard group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
