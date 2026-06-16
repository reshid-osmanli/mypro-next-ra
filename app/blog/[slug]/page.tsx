import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/blog";
import { currencyLabel, dateLabel } from "@/lib/utils";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBlogPostSchema, buildBreadcrumbSchema } from "@/lib/schema-markup";

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
  const post = await getBlogPostBySlug(slug);
  if (!post) return notFound();
  const blogSchema = buildBlogPostSchema({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    coverImage: post.coverImage,
    createdAt: post.createdAt,
    updatedAt: post.createdAt,
  });
  const blogBreadcrumbs = buildBreadcrumbSchema([
    { label: "الرئيسية", href: "/" },
    { label: "المدونة", href: "/blog" },
    { label: post.title },
  ]);

  const paragraphs = post.body.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <JsonLd id="blog-post" data={[blogSchema, blogBreadcrumbs]} />
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-qatar-700">
        <ArrowLeft size={16} /> العودة إلى المدونة
      </Link>
      <header className="mt-6 rounded-lg border border-pearl-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] md:p-10">
        <p className="text-sm font-black text-qatar-700">{dateLabel(post.createdAt)}</p>
        <h1 className="mt-4 text-3xl font-black leading-tight text-zinc-950 md:text-5xl">{post.title}</h1>
        <p className="mt-4 text-lg leading-9 text-zinc-600">{post.excerpt}</p>
        {post.coverImage ? <img src={post.coverImage} alt="" className="mt-8 max-h-[26rem] w-full rounded-lg object-cover" /> : null}
      </header>

      <div className="prose prose-zinc mt-8 max-w-none rounded-lg border border-pearl-200 bg-white p-6 leading-9 shadow-[0_18px_50px_rgba(15,23,42,0.04)] md:p-10">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-5 text-lg leading-10 text-zinc-700">{paragraph}</p>
        ))}
      </div>

      {post.relatedProduct ? (
        <div className="mt-8 rounded-lg border border-qatar-100 bg-qatar-50 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-black text-qatar-800"><ShoppingBag size={16} /> ملف جاهز مرتبط بالمقال</p>
              <h2 className="mt-2 text-2xl font-black text-zinc-950">{post.relatedProduct.title}</h2>
              <p className="mt-1 text-sm text-zinc-600">السعر: {currencyLabel(post.relatedProduct.price)}</p>
            </div>
            <Link href={`/products/${post.relatedProduct.slug}`} className="btn-primary">
              عرض المنتج
            </Link>
          </div>
        </div>
      ) : null}
    </article>
  );
}
