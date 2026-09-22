import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen } from "lucide-react";
import { getProducts, getSubjects } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function GradePage({
  params
}: {
  params: Promise<{ grade: string }>;
}) {
  const { grade } = await params;
  const decodedGrade = decodeURIComponent(grade);
  const [products, subjects, locale] = await Promise.all([
    getProducts({ grade: decodedGrade }),
    getSubjects(decodedGrade),
    getLocale()
  ]);
  const local = (value: { ar: string; en: string }) => (locale === "en" ? value.en : value.ar);

  if (!products.length && !subjects.length) return notFound();

  return (
    <>
      <PageHeader
        eyebrow={local({ ar: "محتوى الصف", en: "Grade content" })}
        title={local({ ar: `محتوى ${decodedGrade}`, en: `${decodedGrade} content` })}
        description={local({
          ar: "كل المنتجات الخاصة بهذا الصف في مكان واحد، حتى لا تختلط العروض والملفات بين الصفوف المختلفة.",
          en: "All products for this grade in one place, keeping files separated by learning level."
        })}
        crumbs={[
          { label: local({ ar: "الرئيسية", en: "Home" }), href: "/" },
          { label: local({ ar: "المكتبة", en: "Library" }), href: "/library" },
          { label: decodedGrade }
        ]}
      />

      <div className="container-content py-10 md:py-12">
        {/* subjects strip */}
        {subjects.length ? (
          <div className="card mb-10 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-label font-bold text-brand-deep">{local({ ar: "المواد التابعة", en: "Subjects in this grade" })}</p>
                <h2 className="mt-2 text-h3 font-bold text-ink">{local({ ar: "اختر المادة داخل هذا الصف", en: "Choose a subject in this grade" })}</h2>
              </div>
              <span className="tnum rounded-pill border border-line bg-surface px-4 py-1.5 text-body-sm font-bold text-ink">
                {subjects.length} {subjects.length === 1 ? local({ ar: "مادة", en: "subject" }) : local({ ar: "مواد", en: "subjects" })}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <Link
                  key={subject}
                  href={`/library/${encodeURIComponent(decodedGrade)}/${encodeURIComponent(subject)}`}
                  className="rounded-pill border border-line bg-surface px-4 py-1.5 text-body-sm font-medium text-ink-soft transition-colors duration-instant hover:border-brand/40 hover:bg-brand-soft/50 hover:text-brand-deep"
                >
                  {subject}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* products */}
        {products.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product, index) => (
              <Reveal key={product.id} index={index % 3} className="h-full">
                <ProductCard product={product} className="h-full" />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title={local({ ar: "لا توجد منتجات بعد لهذا الصف", en: "No products yet for this grade" })}
            description={local({
              ar: "أضف منتجًا من لوحة التحكم وسيظهر هنا تلقائيًا.",
              en: "Add a product from the admin panel and it will appear here automatically."
            })}
          />
        )}
      </div>
    </>
  );
}
