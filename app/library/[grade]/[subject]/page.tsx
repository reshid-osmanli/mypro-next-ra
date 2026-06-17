import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { LocalizedText } from "@/components/site-preferences";
import { MotionShowcase } from "@/components/motion-showcase";
import { getPageByGradeSubject, getProducts } from "@/lib/catalog";

export default async function SubjectPage({
  params
}: {
  params: Promise<{ grade: string; subject: string }>;
}) {
  const { grade, subject } = await params;
  const decodedGrade = decodeURIComponent(grade);
  const decodedSubject = decodeURIComponent(subject);

  const [page, products] = await Promise.all([
    getPageByGradeSubject(decodedGrade, decodedSubject),
    getProducts({ grade: decodedGrade, subject: decodedSubject })
  ]);

  if (!page && !products.length) return notFound();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <Link href={`/library/${encodeURIComponent(decodedGrade)}`} className="inline-flex items-center gap-2 text-sm font-bold text-qatar-700">
        <ArrowLeft size={16} />
        <LocalizedText value={{ ar: "العودة إلى صفحة الصف", en: "Back to grade page" }} />
      </Link>

      <div className="mt-6 overflow-hidden rounded-lg border border-pearl-200 bg-white p-8 shadow-[0_20px_60px_rgba(60,32,18,0.05)] md:p-10">
        <div className="h-1.5 w-40 rounded-md bg-qatar-700" />
        <LocalizedText
          as="p"
          className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-qatar-700"
          value={{ ar: page?.heroLabel ?? "صفحة مادة", en: "Subject page" }}
        />
        <h1 className="mt-3 text-3xl font-black text-zinc-950 md:text-5xl">
          <LocalizedText value={{ ar: page?.title ?? `محتوى ${decodedSubject} للـ ${decodedGrade}`, en: `${decodedSubject} resources for ${decodedGrade}` }} />
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-600">
          <LocalizedText
            value={{
              ar: page?.intro ?? "صفحة تتولد تلقائياً من المنتجات المرتبطة بهذا الصف والمادة.",
              en: "This page collects the products connected to the selected grade and subject."
            }}
          />
        </p>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-500">
          <LocalizedText
            value={{
              ar: page?.body ?? "يمكنك لاحقاً تعديل هذا النص من لوحة التحكم وإنشاء صفحات مستقلة لكل مادة.",
              en: "You can edit this content later from the admin panel and create dedicated pages for each subject."
            }}
          />
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-md bg-white px-3 py-1 text-sm font-bold text-qatar-800 shadow-sm">{decodedGrade}</span>
          <span className="rounded-md bg-white px-3 py-1 text-sm font-bold text-qatar-800 shadow-sm">{decodedSubject}</span>
        </div>
      </div>

      <MotionShowcase variant="subject" className="mt-8" />

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {!products.length ? (
        <div className="panel mt-8 p-8 text-center text-zinc-600">
          <LocalizedText value={{ ar: "لا توجد منتجات بعد لهذه المادة. أضف منتجاً من لوحة التحكم ليظهر هنا تلقائياً.", en: "No products have been added for this subject yet. Add one from the admin panel to show it here." }} />
        </div>
      ) : null}
    </section>
  );
}
