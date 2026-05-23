"use client";

import { useSitePreferences, type LocalizedTextValue } from "./site-preferences";

function SectionHeading({
  eyebrow,
  title,
  description,
  center = false
}: {
  eyebrow: LocalizedTextValue;
  title: LocalizedTextValue;
  description: LocalizedTextValue;
  center?: boolean;
}) {
  const { text } = useSitePreferences();

  return (
    <div className={`max-w-3xl space-y-3 ${center ? "mx-auto text-center" : ""}`}>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-qatar-700">{text(eyebrow)}</p>
      <h2 className="text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">{text(title)}</h2>
      <p className="max-w-2xl text-base leading-8 text-zinc-600">{text(description)}</p>
    </div>
  );
}

export default SectionHeading;
export { SectionHeading };
