import { PageHero } from "@/components/page-hero";
import { ProductExplorer } from "@/components/product-explorer";
import { getAllProducts, getGrades, getSubjects } from "@/lib/catalog";

type ProductsSearchParams = { search?: string; grade?: string; subject?: string };

export default async function ProductsPage({
  searchParams
}: {
  searchParams?: Promise<ProductsSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const [products, grades, subjects] = await Promise.all([
    getAllProducts(),
    getGrades(),
    getSubjects()
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <PageHero
        eyebrow={{ ar: "المتجر", en: "Store" }}
        title={{ ar: "تصفح كل المنتجات حسب الصف والمادة", en: "Browse every product by grade and subject" }}
        description={{
          ar: "بحث مباشر وفلاتر منظمة لعرض عروض البوربوينت، أوراق العمل، وملفات PDF وDOCX ضمن تجربة متجر واضحة.",
          en: "Live search and organized filters for PowerPoint decks, worksheets, PDF, and DOCX files in a clear store experience."
        }}
        motion="store"
      />
      <div className="mt-10">
        <ProductExplorer
          products={products}
          grades={grades}
          subjects={subjects}
          initialSearch={params.search ?? ""}
          initialGrade={params.grade ?? "الكل"}
          initialSubject={params.subject ?? "الكل"}
        />
      </div>
    </section>
  );
}
