import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "gold" | "teal" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-line bg-paper-deep/60 text-ink-soft",
  brand: "border-brand/15 bg-brand-soft text-brand-deep",
  gold: "border-accent-gold/20 bg-accent-gold-soft text-accent-gold",
  teal: "border-accent-teal/20 bg-accent-teal-soft text-accent-teal",
  danger: "border-accent-danger/20 bg-accent-danger-soft text-accent-danger"
};

/** Small status/category marker. h-6, weight 600, no tracking on Arabic. */
export function Badge({
  tone = "neutral",
  className,
  children
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-pill border px-2.5 font-semibold text-caption",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
