import Link from "next/link";
import { LocalizedText } from "@/components/site-preferences";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center lg:px-8">
      <div className="panel p-10">
        <LocalizedText as="h1" className="text-4xl font-black text-zinc-950" value={{ ar: "الصفحة غير موجودة", en: "Page not found" }} />
        <LocalizedText
          as="p"
          className="mt-4 text-base leading-8 text-zinc-600"
          value={{
            ar: "قد تكون الصفحة نُقلت أو حُذفت. يمكنك العودة إلى الصفحة الرئيسية أو المتجر.",
            en: "This page may have moved or been deleted. You can return home or go to the store."
          }}
        />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary"><LocalizedText value={{ ar: "الرئيسية", en: "Home" }} /></Link>
          <Link href="/products" className="btn-secondary"><LocalizedText value={{ ar: "المتجر", en: "Store" }} /></Link>
        </div>
      </div>
    </section>
  );
}
