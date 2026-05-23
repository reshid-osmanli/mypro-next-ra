"use client";

import type { CSSProperties } from "react";
import { FileText, Layers3, PlayCircle, Presentation, ShieldCheck } from "lucide-react";
import { useSitePreferences } from "./site-preferences";
import { SubjectMotionLogo } from "./subject-motion-logo";

type ProductVisualProps = {
  title: string;
  subject: string;
  category: string;
  format: string;
  badge?: string;
  accentA?: string;
  accentB?: string;
  subjectMotionLogo?: string | null;
  compact?: boolean;
};

function ProductVisual({
  title,
  subject,
  category,
  format,
  badge = "جاهز",
  accentA = "#8a1538",
  accentB = "#0f766e",
  subjectMotionLogo,
  compact = false
}: ProductVisualProps) {
  const { text } = useSitePreferences();
  const style = {
    "--accent-a": accentA,
    "--accent-b": accentB
  } as CSSProperties;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f8f5ef] dark:bg-[#101826]" style={style}>
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[var(--accent-a)]" />
      <div className="absolute inset-0 opacity-[0.24] [background-image:linear-gradient(135deg,rgba(15,23,42,0.14)_1px,transparent_1px),linear-gradient(45deg,rgba(138,21,56,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute inset-x-0 bottom-0 h-32" style={{ background: `linear-gradient(0deg, ${accentB}20, transparent)` }} />
      <div className="absolute bottom-6 left-6 right-6 grid grid-cols-4 gap-2 opacity-35">
        {[0, 1, 2, 3].map((item) => (
          <span key={item} className="h-2 bg-[var(--accent-a)]" style={{ opacity: 0.35 + item * 0.12 }} />
        ))}
      </div>
      <div className="sweep-line absolute left-0 top-16 h-px w-2/3 bg-gradient-to-l from-transparent via-[var(--accent-b)] to-transparent" />
      <SubjectMotionLogo src={subjectMotionLogo} subject={subject} compact className="absolute left-4 top-4 z-20" />

      <div className="relative grid h-full grid-cols-[1fr_0.82fr] gap-4 p-5 sm:p-6">
        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-pearl-200 bg-white px-3 py-1.5 text-[11px] font-bold text-zinc-700 shadow-sm">
              <Presentation size={14} className="text-[var(--accent-a)]" />
              {category}
            </div>
            <h3 className="mt-4 line-clamp-3 text-xl font-black leading-[1.35] text-zinc-950 sm:text-2xl">{title}</h3>
            <p className="mt-3 line-clamp-2 text-sm leading-7 text-zinc-600">{subject}</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] font-bold text-zinc-700">
            <div className="rounded-md border border-pearl-200 bg-white px-3 py-2 shadow-sm">
              <span className="block text-zinc-400">{text({ ar: "الصيغة", en: "Format" })}</span>
              <span className="mt-1 block text-zinc-900">{format}</span>
            </div>
            <div className="rounded-md border border-pearl-200 bg-white px-3 py-2 shadow-sm">
              <span className="block text-zinc-400">{text({ ar: "الحالة", en: "Status" })}</span>
              <span className="mt-1 block text-zinc-900">{badge}</span>
            </div>
          </div>
        </div>

        <div className="relative hidden min-h-0 sm:block">
          <div className="absolute inset-3 translate-x-4 translate-y-4 rotate-3 rounded-lg border border-pearl-200 bg-white/75 shadow-[0_18px_38px_rgba(60,32,18,0.10)]" />
          <div className="absolute inset-1 translate-x-2 translate-y-2 rotate-[-3deg] rounded-lg border border-pearl-200 bg-white/90 shadow-[0_18px_38px_rgba(60,32,18,0.10)]" />
          <div className="slide-lift absolute inset-0 rounded-lg border border-pearl-200 bg-white p-3 shadow-[0_22px_50px_rgba(60,32,18,0.16)]">
            <div className="flex items-center justify-between gap-2 border-b border-pearl-100 pb-3">
              <div className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-a)] px-2.5 py-1 text-[10px] font-black text-white">
                <PlayCircle size={13} />
                {text({ ar: "موشن", en: "Motion" })}
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Kutubi</div>
            </div>

            <div className="mt-4 grid h-[calc(100%-3rem)] grid-rows-[auto_1fr_auto] gap-3">
              <div className="space-y-2">
                <div className="h-2.5 w-4/5 bg-zinc-900" />
                <div className="h-1.5 w-full bg-pearl-200" />
                <div className="h-1.5 w-2/3 bg-pearl-200" />
              </div>

              <div className="grid grid-cols-[0.9fr_1.1fr] gap-2">
                <div className="relative overflow-hidden rounded-md bg-[var(--accent-a)]">
                  <div className="absolute inset-x-2 top-3 h-1 bg-white/45" />
                  <div className="absolute bottom-3 right-3 h-9 w-9 rounded-full border-4 border-white/70" />
                  <div className="absolute left-3 top-6 flex h-8 items-end gap-1 text-white/75" aria-hidden="true">
                    <span className="h-3 w-1.5 bg-current" />
                    <span className="h-5 w-1.5 bg-current" />
                    <span className="h-7 w-1.5 bg-current" />
                  </div>
                </div>
                <div className="space-y-2">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="rounded-md border border-pearl-200 bg-pearl-50 p-2">
                      <div className="mb-2 h-1.5 w-2/3 bg-zinc-300" />
                      <div className="h-1.5 overflow-hidden bg-white">
                        <div className="meter-pulse h-full bg-[var(--accent-b)]" style={{ animationDelay: `${item * 0.35}s` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-black text-zinc-500">
                <span>PPTX</span>
                <span>PDF</span>
                <span>{text({ ar: "تحميل فوري", en: "Instant download" })}</span>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-5 -right-4 flex w-28 rotate-[-7deg] items-center gap-2 rounded-lg border border-pearl-200 bg-white px-3 py-2 text-[11px] font-black text-zinc-800 shadow-[0_14px_35px_rgba(60,32,18,0.14)]">
            <ShieldCheck size={14} className="text-emerald-700" />
            {text({ ar: "تحميل آمن", en: "Secure" })}
          </div>
        </div>
      </div>

      {!compact ? (
        <div className="absolute bottom-5 right-5 hidden items-center gap-2 rounded-md border border-pearl-200 bg-white/95 px-3 py-2 text-xs font-bold text-zinc-700 shadow-sm backdrop-blur sm:flex">
          <Layers3 size={14} className="text-[var(--accent-b)]" />
          {text({ ar: "ملفات منظمة", en: "Organized files" })}
        </div>
      ) : null}

      <FileText className="absolute bottom-5 left-5 text-zinc-300" size={compact ? 28 : 36} />
    </div>
  );
}

export { ProductVisual };
