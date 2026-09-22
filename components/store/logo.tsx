import { cn } from "@/lib/utils";

/**
 * KUTUBI brand mark — a calm open book in the brand color.
 * Static on purpose (the old animated logo was removed in the redesign).
 * See VISUAL_SYSTEM.md §8.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-sm bg-brand", className)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[62%] w-[62%] text-white">
        <path
          d="M12 6.2C10.1 4.8 7.4 4.4 4.8 5.3V18.3C7.4 17.4 10.1 17.8 12 19.2C13.9 17.8 16.6 17.4 19.2 18.3V5.3C16.6 4.4 13.9 4.8 12 6.2Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M12 6.4V19.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/**
 * Full wordmark: mark + name.
 * name comes from site settings; the mark is fixed brand identity.
 */
export function Wordmark({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <LogoMark className="size-9" />
      <span className="truncate text-h4 font-bold text-ink">{name}</span>
    </span>
  );
}
