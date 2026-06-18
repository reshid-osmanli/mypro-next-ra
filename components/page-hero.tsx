"use client";

import type { ReactNode } from "react";
import { useSitePreferences, type LocalizedTextValue } from "./site-preferences";
import { MotionShowcase, type MotionShowcaseVariant } from "./motion-showcase";

function PageHero({
  eyebrow,
  title,
  description,
  actions,
  motion
}: {
  eyebrow: LocalizedTextValue;
  title: LocalizedTextValue;
  description: LocalizedTextValue;
  actions?: ReactNode;
  motion?: MotionShowcaseVariant;
}) {
  const { text } = useSitePreferences();

  return (
    <div className="relative overflow-hidden border-b border-pearl-200 pb-8 md:pb-10">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-qatar-200 to-transparent" />
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="inline-flex rounded-md border border-pearl-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-qatar-800 shadow-sm">
          {text(eyebrow)}
        </div>
        <h1 className="mt-4 text-3xl font-black leading-[1.18] text-zinc-950 md:text-5xl">
          {text(title)}
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-zinc-600">{text(description)}</p>
        {actions ? <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div> : null}
      </div>
      {motion ? (
        <div className="relative mx-auto mt-8 max-w-4xl">
          <MotionShowcase variant={motion} />
        </div>
      ) : null}
    </div>
  );
}

export default PageHero;
export { PageHero };
