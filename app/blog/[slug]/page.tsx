import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ShoppingBag } from "lucide-react";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/blog";
import { dateLabel } from "@/lib/utils";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBlogPostSchema, buildBreadcrumbSchema } from "@/lib/schema-markup";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { ArrowForward } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "مقال غير موجود" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : undefined
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, locale] = await Promise.all([getBlogPostBySlug(slug), getLocale()]);
  if (!post) return notFound();
  const local = (value: { ar: string; en: string }) => (locale === "en" ? value.en : value.ar);
  const blogSchema = buildBlogPostSchema({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    coverImage: post.coverImage,
    createdAt: post.createdAt,
    updatedAt: post.createdAt
  });
  const blogBreadcrumbs = buildBreadcrumbSchema([
    { label: "الرئيسية", href: "/" },
    { label: "المدونة", href: "/blog" },
    { label: post.title }
  ]);

  const paragraphs = post.body.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);

  return (
    <div className="container-content py-10 md:py-14">
      <JsonLd id="blog-post" data={[blogSchema, blogBreadcrumbs]} />

      <Breadcrumbs
        items={[
          { label: local({ ar: "الرئيسية", en: "Home" }), href: "/" },
          { label: local({ ar: "المدونة", en: "Blog" }), href: "/blog" },
          { label: post.title }
        ]}
        className="mb-8"
      />

      <article className="mx-auto max-w-3xl">
        <header>
          <p className="text-label font-bold text-brand-deep">{dateLabel(post.createdAt)}</p>
          <h1 className="mt-4 text-h1 font-bold leading-snug tracking-[-0.005em] text-ink">{post.title}</h1>
          <p className="mt-5 text-lead leading-10 text-ink-soft">{post.excerpt}</p>
          {post.coverImage ? (
            <img src={post.coverImage} alt="" className="mt-9 max-h-[26rem] w-full rounded-sm border border-line object-cover" />
          ) : null}
        </header>

        <div className="mt-10 space-y-6 border-t border-line pt-10">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-lg leading-10 text-ink-soft">
              {paragraph}
            </p>
          ))}
        </div>

        {post.relatedProduct ? (
          <div className="card mt-12 flex flex-wrap items-center justify-between gap-5 p-6 md:p-7">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-label font-bold text-brand-deep">
                <ShoppingBag size={15} aria-hidden="true" />
                {local({ ar: "ملف جاهز مرتبط بالمقال", en: "Ready file linked to this article" })}
              </p>
              <h2 className="mt-2.5 truncate text-h3 font-bold text-ink">{post.relatedProduct.title}</h2>
              <div className="mt-3">
                <Price value={post.relatedProduct.price} size="sm" />
              </div>
            </div>
            <Button href={`/products/${post.relatedProduct.slug}`} variant="primary" size="md" className="shrink-0">
              {local({ ar: "عرض المنتج", en: "View product" })}
              <ArrowForward size={15} aria-hidden="true" />
            </Button>
          </div>
        ) : null}

        <div className="mt-12 border-t border-line pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-body-sm font-semibold text-ink-soft transition-colors duration-instant hover:text-brand-deep"
          >
            <ArrowForward size={14} className="rotate-180" aria-hidden="true" />
            {local({ ar: "العودة إلى المدونة", en: "Back to blog" })}
          </Link>
        </div>
      </article>
    </div>
  );
}
