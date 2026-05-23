"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useSitePreferences } from "./site-preferences";

type SubjectMotionLogoProps = {
  src?: string | null;
  subject: string;
  compact?: boolean;
  className?: string;
};

export function SubjectMotionLogo({ src, subject, compact = false, className = "" }: SubjectMotionLogoProps) {
  const { text } = useSitePreferences();
  if (!src) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -3, scale: 1.02 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`subject-motion-logo inline-flex items-center gap-2 border border-white/70 bg-white/90 px-2.5 py-2 text-xs font-black text-zinc-900 shadow-[0_16px_34px_rgba(45,24,32,0.16)] backdrop-blur ${className}`}
      title={text({ ar: `شعار ${subject} المتحرك`, en: `${subject} animated logo` })}
    >
      <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden border border-qatar-100 bg-qatar-50">
        <span className="absolute inset-0 subject-logo-sheen" />
        <img src={src} alt={text({ ar: `شعار ${subject}`, en: `${subject} logo` })} className="relative h-full w-full object-cover" />
      </span>
      {!compact ? (
        <span className="min-w-0 leading-tight">
          <span className="flex items-center gap-1 text-qatar-800">
            <Sparkles size={13} />
            {text({ ar: "شعار المادة", en: "Subject logo" })}
          </span>
          <span className="mt-0.5 block max-w-28 truncate text-[11px] text-zinc-500">{subject}</span>
        </span>
      ) : null}
    </motion.div>
  );
}
