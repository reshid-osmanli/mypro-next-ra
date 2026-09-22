import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen } from "lucide-react";
import { getPageByGradeSubject, getProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function SubjectPage({
  params
}: {
  params: Promise<{ grade: string; subject: string }>;
}) {
  const { grade, subject } = await params;
  const decodedGrade = decodeURIComponent(grade);
  const decodedSubject = decodeURIComponent(subject);

  const [page, products, locale] = await Promise.all([
    getPageByGradeSubject(decodedGrade, decodedSubject),
    getProducts({ grade: decodedGrade, subject: decodedSubject }),
    getLocale()
  ]);
  const local = (value: { ar: string; en: string }) => (locale === "en" ? value.en : value.ar);

  if (!page && !products.length) return notFound();

  return (
    <>
      <PageHeader
        eyebrow={page?.heroLabel ?? local({ ar: "صفحة مادة", en: "Subject page" })}
        title={page?.title ?? local({ ar: `محتوى ${decodedSubject} للـ ${decodedGrade}`, en: `${decodedSubject} resources for ${decodedGrade}` })}
        description={page?.intro ?? local({
          ar: "صفحة تجمع المنتجات المرتبطة بهذا الصف والمادة.",
          en: "This page collects the products connected to the selected grade and subject."
        })}
        crumbs={[
          { label: local({ ar: "الرئيسية", en: "Home" }), href: "/" },
          { label: local({ ar: "المكتبة", en: "Library" }), href: "/library" },
          { label: decodedGrade, href: `/library/${encodeURIComponent(decodedGrade)}` },
          { label: decodedSubject }
        ]}
      />

      {page?.body ? (
        <div className="border-b border-line bg-paper-deep/30">
          <div className="container-content py-8 text-body leading-9 text-ink-soft">
            <p className="max-w-3xl">{page.body}</p>
          </div>
        </div>
      ) : null}

      <div className="container-content py-10 md:py-12">
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
            title={local({ ar: "لا توجد منتجات بعد لهذه المادة", en: "No products yet for this subject" })}
            description={local({
              ar: "أضف منتجًا من لوحة التحكم وسيظهر هنا تلقائيًا.",
              en: "Add a product from the admin panel and it will appear here automatically."
            })}
            action={
              <Link
                href={`/library/${encodeURIComponent(decodedGrade)}`}
                className="inline-flex h-10 items-center gap-2 rounded-sm border border-line-strong px-4 text-body-sm font-semibold text-ink transition-colors duration-instant hover:bg-paper-deep"
              >
                {local({ ar: "العودة إلى الصف", en: "Back to grade" })}
              </Link>
            }
          />
        )}
      </div>
    </>
  );
}
