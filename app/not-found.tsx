import { BookOpen } from "lucide-react";
import { LocalizedText } from "@/components/site-preferences";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="container-content py-20 md:py-28">
      <div className="mx-auto max-w-xl">
        <div className="card p-10 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-pill border border-line bg-surface text-brand">
            <BookOpen size={24} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-h1 font-bold text-ink">
            <LocalizedText value={{ ar: "الصفحة غير موجودة", en: "Page not found" }} />
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-body leading-9 text-ink-soft">
            <LocalizedText
              value={{
                ar: "قد تكون الصفحة نُقلت أو حُذفت. يمكنك العودة إلى الصفحة الرئيسية أو المتجر.",
                en: "This page may have moved or been deleted. You can return home or go to the store."
              }}
            />
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/" variant="primary" size="md">
              <LocalizedText value={{ ar: "الرئيسية", en: "Home" }} />
            </Button>
            <Button href="/products" variant="secondary" size="md">
              <LocalizedText value={{ ar: "المتجر", en: "Store" }} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
