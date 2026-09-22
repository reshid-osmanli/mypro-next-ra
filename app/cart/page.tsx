import { CartClient } from "@/components/cart-client";
import { PageHeader } from "@/components/ui/page-header";
import { getAllProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const products = await getAllProducts();

  return (
    <>
      <PageHeader
        eyebrow={{ ar: "السلة", en: "Cart" }}
        title={{ ar: "مراجعة المشتريات الرقمية", en: "Review digital purchases" }}
        description={{
          ar: "كل منتج رقمي يضاف مرة واحدة فقط. احذف ما لا تريد، ثم تابع إلى صفحة الدفع لإكمال الطلب.",
          en: "Each digital product is added once only. Remove anything you do not need, then continue to checkout."
        }}
        crumbs={[
          { label: { ar: "الرئيسية", en: "Home" }, href: "/" },
          { label: { ar: "السلة", en: "Cart" } }
        ]}
      />
      <div className="container-content py-10 md:py-12">
        <CartClient products={products} />
      </div>
    </>
  );
}
