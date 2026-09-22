import Image from "next/image";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductCoverProps = {
  title: string;
  subject: string;
  category: string;
  format: string;
  coverImage?: string | null;
  additionalImages?: string[];
  /** show category + discount badges */
  showBadges?: boolean;
  discountPercent?: number | null;
  /** enable the shared-element view transition name (card → detail) */
  sharedElementName?: string;
  /** LCP cover (first product on a page) */
  priority?: boolean;
  className?: string;
  /** image padding scale */
  padded?: boolean;
};

/**
 * KUTUBI product cover — one frame for every product, everywhere.
 * Real cover → object-contain on paper-deep. No cover → a quiet
 * "printed cover" placeholder (title + subject + format).
 * See VISUAL_SYSTEM.md §11.
 */
export function ProductCover({
  title,
  subject,
  category,
  format,
  coverImage,
  additionalImages = [],
  showBadges = true,
  discountPercent,
  sharedElementName,
  priority = false,
  className,
  padded = true
}: ProductCoverProps) {
  const image = coverImage || additionalImages[0] || null;
  const discount =
    discountPercent == null ? null : Math.min(95, Math.max(1, Math.round(discountPercent)));

  return (
    <div
      className={cn("cover-frame", className)}
      style={
        sharedElementName ? { viewTransitionName: sharedElementName } : undefined
      }
    >
      {showBadges ? (
        <div className="pointer-events-none absolute top-3 start-3 z-10">
          <span className="inline-flex h-6 items-center rounded-pill border border-line bg-surface/95 px-2.5 text-caption font-semibold text-ink-soft shadow-soft backdrop-blur-sm">
            {category}
          </span>
        </div>
      ) : null}
      {showBadges && discount ? (
        <div className="pointer-events-none absolute top-3 end-3 z-10">
          <span className="inline-flex h-6 items-center rounded-pill bg-accent-gold px-2.5 text-caption font-bold text-white shadow-soft">
            −{discount}%
          </span>
        </div>
      ) : null}

      {image ? (
        <div className="h-full w-full transition-transform duration-normal ease-standard group-hover:scale-[1.02]">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className={cn("object-contain", padded && "p-4")}
            priority={priority}
          />
        </div>
      ) : (
        <PlaceholderCover title={title} subject={subject} format={format} />
      )}
    </div>
  );
}

/**
 * Quiet "printed cover" for products without an uploaded image.
 * No fake mockups — just typography on the paper-deep surface.
 */
function PlaceholderCover({ title, subject, format }: { title: string; subject: string; format: string }) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden p-5">
      {/* faint rule lines — a nod to a worksheet, kept very quiet */}
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-line" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-line" aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <span className="grid size-9 place-items-center rounded-sm border border-line bg-surface/80 text-brand">
          <FileText size={16} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="tnum rounded-pill border border-line bg-surface/80 px-2.5 py-1 text-caption font-semibold text-ink-soft">
          {format}
        </span>
      </div>

      <div className="space-y-1.5">
        <p className="text-caption font-semibold text-ink-faint">{subject}</p>
        <h3 className="line-clamp-3 text-h4 font-bold leading-snug text-ink">{title}</h3>
      </div>
    </div>
  );
}
