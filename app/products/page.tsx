import { ProductExplorer } from "@/components/product-explorer";
import { PageHeader } from "@/components/ui/page-header";
import { getAllProducts, getGrades, getSubjects } from "@/lib/catalog";

type ProductsSearchParams = { search?: string; grade?: string; subject?: string };

export const dynamic = "force-dynamic";

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
    <>
      <PageHeader
        eyebrow={{ ar: "المتجر", en: "Store" }}
        title={{ ar: "تصفح كل المنتجات", en: "Browse every product" }}
        description={{
          ar: "بحث مباشر وفلاتر منظمة حسب الصف والمادة ونوع الملف لعروض البوربوينت وأوراق العمل وملفات PDF وDOCX.",
          en: "Live search and organized filters by grade, subject, and file type for PowerPoint decks, worksheets, PDF, and DOCX files."
        }}
        crumbs={[
          { label: { ar: "الرئيسية", en: "Home" }, href: "/" },
          { label: { ar: "المنتجات", en: "Products" } }
        ]}
      />
      <div className="container-content py-10 md:py-12">
        <ProductExplorer
          products={products}
          grades={grades}
          subjects={subjects}
          initialSearch={params.search ?? ""}
          initialGrade={params.grade ?? "الكل"}
          initialSubject={params.subject ?? "الكل"}
        />
      </div>
    </>
  );
}
