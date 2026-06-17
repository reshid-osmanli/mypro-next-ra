import { Eye, ShieldCheck } from "lucide-react";
import { LocalizedText } from "./site-preferences";

type Props = {
  title: string;
  images: string[];
};

export function ProductPreviewGallery({ title, images }: Props) {
  const previewImages = images.filter(Boolean).slice(0, 4);
  if (!previewImages.length) return null;

  return (
    <section className="border-t border-pearl-200 p-6 md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-qatar-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-qatar-800">
            <Eye size={16} />
            <LocalizedText value={{ ar: "معاينة قبل الدفع", en: "Preview before purchase" }} />
          </div>
          <LocalizedText
            as="h2"
            className="mt-4 text-2xl font-black text-zinc-950"
            value={{ ar: "صور من داخل الملف مع علامة مائية", en: "Watermarked pages from inside the file" }}
          />
          <p className="mt-2 max-w-3xl leading-8 text-zinc-600">
            <LocalizedText
              value={{
                ar: "هذه المعاينات تساعدك على تقييم جودة التصميم قبل الدفع. النسخة الكاملة بدون علامة مائية تظهر بعد الشراء.",
                en: "These previews help you assess design quality before checkout. The full unwatermarked version is delivered after purchase."
              }}
            />
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          <ShieldCheck size={16} />
          <LocalizedText value={{ ar: "محتوى محمي", en: "Protected preview" }} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {previewImages.map((image, index) => (
          <figure key={`${image}-${index}`} className="relative overflow-hidden rounded-lg border border-pearl-200 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
            <div className="relative aspect-[4/3] overflow-hidden bg-pearl-50">
              <img src={image} alt={`${title} preview ${index + 1}`} className="h-full w-full object-contain p-2 blur-[0.2px]" />
              <div className="absolute inset-0 bg-white/10" />
              <div className="pointer-events-none absolute inset-0 flex rotate-[-24deg] select-none items-center justify-center text-center text-3xl font-black uppercase tracking-[0.18em] text-qatar-800/20">
                KUTUBI PREVIEW
              </div>
              <div className="pointer-events-none absolute -left-8 bottom-6 right-0 rotate-[-24deg] select-none text-center text-sm font-black uppercase tracking-[0.22em] text-qatar-800/25">
                SAMPLE · WATERMARK
              </div>
            </div>
            <figcaption className="border-t border-pearl-100 px-4 py-3 text-sm font-bold text-zinc-700">
              <LocalizedText value={{ ar: `معاينة ${index + 1}`, en: `Preview ${index + 1}` }} />
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
