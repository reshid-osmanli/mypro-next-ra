import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { buildProductSchema, buildBreadcrumbSchema, buildReviewsSchema } from "@/lib/schema-markup";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductBadges } from "@/components/product-badges";
import { StickyAddToCart } from "@/components/sticky-add-to-cart";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { ProductPageGallery } from "@/components/store/product-page-gallery";
import { ProductPreviewGallery } from "@/components/product-preview-gallery";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { ProductReviews } from "@/components/product-reviews";
import { auth } from "@/auth";
import { getProductBySlug } from "@/lib/catalog";
import { getProductReviews, userCanReviewProduct } from "@/lib/reviews";
import { FileText, ShieldCheck, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "منتج غير موجود" };
  return {
    title: product.title,
    description: product.excerpt,
    openGraph: {
      title: product.title,
      description: product.excerpt,
      images: product.coverImage ? [product.coverImage] : undefined
    }
  };
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return notFound();

  const productFiles = product.files ?? [];
  const previewImages = [product.coverImage, ...(product.additionalImages ?? [])].filter(Boolean) as string[];
  const session = await auth();
  const [reviews, canReview] = await Promise.all([
    getProductReviews(product.id),
    userCanReviewProduct(product.id, session?.user?.email)
  ]);
  const locale = (await getLocale()) as "ar" | "en";
  const local = (value: { ar: string; en: string }) => (locale === "en" ? value.en : value.ar);
  const productSchema = buildProductSchema({
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description ?? product.excerpt,
    excerpt: product.excerpt,
    price: product.price,
    compareAt: product.compareAt,
    coverImage: product.coverImage,
    images: product.additionalImages ?? [],
    averageRating: product.averageRating,
    reviewCount: product.reviewCount
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "الرئيسية", href: "/" },
    { label: "المتجر", href: "/products" },
    { label: product.title }
  ]);
  const reviewSchema = reviews.length
    ? buildReviewsSchema({
        productSlug: product.slug,
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          author: r.customerName ?? undefined,
          createdAt: r.createdAt
        }))
      })
    : null;

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
    accentB: product.accentB,
    coverImage: product.coverImage ?? null
  } as const;

  const sharedElementName = `product-cover-${product.slug}`;

  return (
    <div className="container-content py-8 md:py-12">
      <JsonLd id="product" data={[productSchema, breadcrumbSchema, ...(reviewSchema ? [reviewSchema] : [])]} />

      <Breadcrumbs
        items={[
          { label: local({ ar: "الرئيسية", en: "Home" }), href: "/" },
          { label: local({ ar: "المنتجات", en: "Products" }), href: "/products" },
          { label: product.title }
        ]}
        className="mb-7"
      />

      <div className="card overflow-hidden">
        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[0.98fr_1.02fr] lg:gap-10 lg:p-10">
          {/* gallery */}
          <ProductPageGallery
            title={product.title}
            subject={product.subject}
            category={product.category}
            format={product.format}
            images={previewImages}
            sharedElementName={sharedElementName}
          />

          {/* buy panel */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{product.category}</Badge>
              <Badge tone="brand">{product.badge}</Badge>
              <ProductBadges
                product={{ compareAt: product.compareAt, price: product.price, createdAt: product.createdAt }}
              />
            </div>

            <h1 className="mt-5 text-h1 font-bold leading-snug tracking-[-0.005em] text-ink">{product.title}</h1>

            <div className="mt-4 flex flex-wrap gap-2">
              {[product.grade, product.subject, product.format, product.pages].filter(Boolean).map((tag) => (
                <span key={tag} className="rounded-pill border border-line bg-surface px-3 py-1 text-caption font-medium text-ink-soft">
                  {tag}
                </span>
              ))}
            </div>

            <p className="mt-6 text-body leading-9 text-ink-soft">{product.description}</p>

            <div className="mt-8 border-t border-line pt-6">
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <Price value={product.price} compareAt={product.compareAt} size="xl" />
                <span className="pb-1.5 text-caption font-medium text-ink-faint">USD</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <AddToCartButton item={item} size="lg" />
                <Button href="/checkout" variant="secondary" size="lg">
                  {local({ ar: "الانتقال إلى الدفع", en: "Go to checkout" })}
                </Button>
              </div>

              <ul className="mt-8 space-y-3">
                {[
                  { icon: FileText, value: { ar: `يتضمن ${productFiles.length} ${productFiles.length === 1 ? "ملفًا" : "ملفات"} قابلة للتحميل فورًا بعد إتمام الشراء.`, en: `Includes ${productFiles.length} ${productFiles.length === 1 ? "file" : "files"} ready to download right after purchase.` } },
                  { icon: Zap, value: { ar: "روابط تحميل خاصة بصاحب الطلب تنتهي صلاحيتها بعد انتهاء مدة التحميل.", en: "Private download links for the buyer, expiring after the download window." } },
                  { icon: ShieldCheck, value: { ar: "دفع آمن عبر Stripe أو PayPal دون مشاركة بياناتك مع طرف ثالث.", en: "Secure payment via Stripe or PayPal, with no third-party sharing." } }
                ].map(({ icon: IconComponent, value }, index) => (
                  <li key={index} className="flex items-start gap-3 text-body-sm leading-7 text-ink-soft">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-sm border border-line bg-surface text-brand">
                      <IconComponent size={15} strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    {local(value)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* watermarked previews */}
        <ProductPreviewGallery title={product.title} images={previewImages} />

        {/* attached files */}
        <section className="border-t border-line p-6 md:p-10">
          <h2 className="text-h2 font-bold text-ink">{local({ ar: "الملفات المرتبطة", en: "Attached files" })}</h2>
          {productFiles.length ? (
            <div className="mt-5 space-y-2.5">
              {productFiles.map((file: { id: string; title: string; mimeType?: string; size?: number }) => (
                <div key={file.id} className="flex items-center justify-between gap-4 rounded-sm border border-line bg-surface px-4 py-3.5">
                  <span className="flex min-w-0 items-center gap-3 text-body-sm font-semibold text-ink">
                    <FileText size={17} className="shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
                    <span className="truncate">{file.title}</span>
                  </span>
                  <span className="shrink-0 text-caption text-ink-faint">{local({ ar: "بعد الشراء", en: "After purchase" })}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-sm border border-dashed border-line-strong p-5 text-body-sm text-ink-faint">
              {local({ ar: "لا توجد ملفات إضافية لهذا المنتج بعد.", en: "No additional files have been attached to this product yet." })}
            </p>
          )}
        </section>

        {/* reviews */}
        <ProductReviews
          productId={product.id}
          initialReviews={reviews}
          canReview={canReview}
          averageRating={product.averageRating ?? 0}
          reviewCount={product.reviewCount ?? 0}
        />
      </div>

      <StickyAddToCart
        product={{
          id: product.id,
          slug: product.slug,
          title: product.title,
          price: product.price,
          compareAt: product.compareAt,
          grade: product.grade,
          subject: product.subject,
          badge: product.badge,
          format: product.format,
          accentA: product.accentA,
          accentB: product.accentB,
          coverImage: product.coverImage ?? null
        }}
      />
    </div>
  );
}
