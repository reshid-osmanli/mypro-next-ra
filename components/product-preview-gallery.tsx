"use client";

import { Eye } from "lucide-react";
import { useSitePreferences } from "@/components/site-preferences";

type Props = {
  title: string;
  images: string[];
};

/**
 * Watermarked preview strip — real protection feature:
 * buyers see sample pages before payment; the clean copy ships after purchase.
 */
export function ProductPreviewGallery({ title, images }: Props) {
  const { text } = useSitePreferences();
  const previewImages = images.filter(Boolean).slice(0, 4);
  if (!previewImages.length) return null;

  return (
    <section className="border-t border-line p-6 md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-label font-bold text-brand-deep">
            <span className="h-px w-7 bg-brand" aria-hidden="true" />
            {text({ ar: "معاينة قبل الدفع", en: "Preview before purchase" })}
          </p>
          <h2 className="mt-3 text-h2 font-bold text-ink">
            {text({ ar: "صفحات من داخل الملف", en: "Pages from inside the file" })}
          </h2>
          <p className="mt-2 max-w-2xl text-body leading-8 text-ink-soft">
            {text({
              ar: "معاينات بمقياس كامل تساعدك على تقييم الجودة قبل الدفع. النسخة النهائية بدون علامة مائية تُسلَّم بعد إتمام الشراء.",
              en: "Full-size previews help you judge quality before paying. The final unwatermarked copy is delivered after purchase."
            })}
          </p>
        </div>
        <span className="inline-flex h-9 items-center gap-2 rounded-pill border border-line bg-surface px-4 text-caption font-semibold text-ink-soft">
          <Eye size={14} aria-hidden="true" />
          {text({ ar: "معاينة محمية", en: "Protected preview" })}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {previewImages.map((image, index) => (
          <figure key={`${image}-${index}`} className="card overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden bg-paper-deep/50">
              <img src={image} alt={`${title} — ${text({ ar: "معاينة", en: "Preview" })} ${index + 1}`} className="h-full w-full object-contain p-2" />
              <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center" aria-hidden="true">
                <span className="-rotate-[26deg] whitespace-nowrap text-2xl font-bold tracking-[0.3em] text-ink/10">K U T U B I</span>
              </div>
            </div>
            <figcaption className="border-t border-line px-4 py-2.5 text-caption font-semibold text-ink-soft">
              {text({ ar: `معاينة ${index + 1}`, en: `Preview ${index + 1}` })}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
