import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { ProductCard } from "@/components/product-card";
import { LocalizedText } from "@/components/site-preferences";
import { getProducts, getSubjects } from "@/lib/catalog";

export default async function GradePage({
  params
}: {
  params: Promise<{ grade: string }>;
}) {
  const { grade } = await params;
  const decodedGrade = decodeURIComponent(grade);
  const [products, subjects] = await Promise.all([
    getProducts({ grade: decodedGrade }),
    getSubjects(decodedGrade)
  ]);

  if (!products.length) return notFound();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <PageHero
        eyebrow={{ ar: "صفوف المواد", en: "Grade subjects" }}
        title={{ ar: `محتوى ${decodedGrade}`, en: `${decodedGrade} content` }}
        description={{
          ar: "كل المنتجات الخاصة بهذا الصف في مكان واحد حتى لا تختلط العروض والملفات بين الصفوف المختلفة.",
          en: "All products for this grade appear in one place, keeping files separated by learning level."
        }}
        motion="library"
      />

      <div className="mt-8 rounded-lg border border-pearl-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <LocalizedText as="p" className="text-sm font-black uppercase tracking-[0.16em] text-qatar-700" value={{ ar: "المواد التابعة", en: "Related subjects" }} />
            <LocalizedText as="h2" className="mt-2 text-xl font-black text-zinc-950" value={{ ar: "اختر المادة داخل هذا الصف", en: "Choose a subject in this grade" }} />
          </div>
          <span className="rounded-md bg-qatar-50 px-4 py-2 text-sm font-bold text-qatar-800">
            {subjects.length} <LocalizedText value={{ ar: "مادة", en: "subjects" }} />
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <Link key={subject} href={`/library/${encodeURIComponent(decodedGrade)}/${encodeURIComponent(subject)}`} className="chip">
              {subject}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
