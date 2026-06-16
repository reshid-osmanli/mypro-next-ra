import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { CartClient } from "@/components/cart-client";
import { LocalizedText } from "@/components/site-preferences";
import { getAllProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const products = await getAllProducts();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <PageHero
        eyebrow={{ ar: "السلة", en: "Cart" }}
        title={{ ar: "مراجعة المشتريات الرقمية", en: "Review digital purchases" }}
        description={{
          ar: "كل منتج رقمي يضاف مرة واحدة فقط. احذف ما لا تريد، ثم تابع إلى صفحة الدفع لإكمال الطلب.",
          en: "Each digital product is added once only. Remove anything you do not need, then continue to checkout."
        }}
        actions={<Link href="/products" className="btn-secondary"><LocalizedText value={{ ar: "تصفح المزيد", en: "Browse more" }} /></Link>}
        motion="cart"
      />
      <div className="mt-8">
        <CartClient products={products} />
      </div>
    </section>
  );
}
