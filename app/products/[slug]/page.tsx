import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductVisual } from "@/components/product-visual";
import { LocalizedText } from "@/components/site-preferences";
import { MotionShowcase } from "@/components/motion-showcase";
import { getAllProducts, getProductBySlug } from "@/lib/catalog";
import { currencyLabel } from "@/lib/utils";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return notFound();

  const item = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    price: product.price,
    grade: product.grade,
    subject: product.subject,
    badge: product.badge,
    format: product.format,
    accentA: product.accentA,
    accentB: product.accentB
  } as const;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-qatar-700">
        <ArrowLeft size={16} /> <LocalizedText value={{ ar: "العودة إلى المتجر", en: "Back to store" }} />
      </Link>

      <div className="mt-6 overflow-hidden rounded-lg border border-pearl-200 bg-white shadow-[0_18px_50px_rgba(60,32,18,0.06)]">
        <div className="grid gap-0 lg:grid-cols-[0.98fr_1.02fr]">
          <div className="relative min-h-[26rem] bg-pearl-100">
            <ProductVisual
              title={product.title}
              subject={product.subject}
              category={product.category}
              format={product.format}
              badge={product.badge}
              accentA={product.accentA}
              accentB={product.accentB}
              coverImage={product.coverImage}
              additionalImages={product.additionalImages}
              subjectMotionLogo={product.subjectMotionLogo}
              motionEnabled={product.motionEnabled}
              motionPosition={product.motionPosition}
              motionScale={product.motionScale}
              motionRotation={product.motionRotation}
              motionSrc={product.motionSrc}
            />
          </div>

          <div className="p-6 md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-md bg-pearl-100 px-3 py-1 text-xs font-bold text-zinc-700">{product.category}</span>
              <span className="rounded-md bg-qatar-50 px-3 py-1 text-xs font-bold text-qatar-800">{product.badge}</span>
            </div>
            <h1 className="mt-6 text-3xl font-black leading-tight text-zinc-950 md:text-5xl">{product.title}</h1>
            <p className="mt-4 max-w-3xl leading-8 text-zinc-600">{product.description}</p>

            <div className="mt-8 flex flex-wrap gap-2 text-sm">
              {[product.grade, product.subject, product.format, product.pages].map((tag) => (
                <span key={tag} className="rounded-md bg-pearl-100 px-3 py-1 font-bold text-zinc-700">{tag}</span>
              ))}
            </div>

            <div className="mt-8 flex items-end gap-3">
              <span className="text-4xl font-black text-qatar-800">{currencyLabel(product.price)}</span>
              {product.compareAt ? <span className="text-lg text-zinc-400 line-through">{currencyLabel(product.compareAt)}</span> : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <AddToCartButton item={item} />
              <Link href="/checkout" className="btn-secondary">
                <LocalizedText value={{ ar: "الانتقال إلى الدفع", en: "Go to checkout" }} />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-8 border-t border-pearl-200 p-6 md:p-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <LocalizedText as="h2" className="text-xl font-black text-zinc-950" value={{ ar: "ماذا ستحصل عليه؟", en: "What you get" }} />
            <ul className="mt-4 space-y-3">
              {[
                { ar: product.excerpt, en: product.excerpt },
                { ar: "تنظيم واضح حسب الصف والمادة", en: "Clear organization by grade and subject" },
                { ar: "الملفات تظهر بعد إتمام الشراء", en: "Files are available after purchase" },
                { ar: "مناسب للعرض والطباعة والتعديل", en: "Useful for presenting, printing, and editing" }
              ].map((feature) => (
                <li key={feature.ar} className="flex items-center gap-2 text-zinc-700">
                  <CheckCircle2 size={18} className="text-emerald-700" /> <LocalizedText value={feature} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <LocalizedText as="h2" className="text-xl font-black text-zinc-950" value={{ ar: "الملفات المرتبطة", en: "Attached files" }} />
            <MotionShowcase variant="product" compact className="mb-4 mt-4" />
            {product.files.length ? (
              <div className="space-y-3">
                {product.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between rounded-lg border border-pearl-200 bg-pearl-50 px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800">
                      <FileText size={16} className="text-qatar-700" /> {file.title}
                    </span>
                    <span className="text-xs text-zinc-500"><LocalizedText value={{ ar: "بعد الشراء", en: "After purchase" }} /></span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-pearl-300 p-5 text-sm text-zinc-600">
                <LocalizedText value={{ ar: "لا توجد ملفات إضافية لهذا المنتج بعد.", en: "No additional files have been attached to this product yet." }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
