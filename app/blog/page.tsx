import Link from "next/link";
import { ArrowLeft, BookOpenText } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { getBlogPosts } from "@/lib/blog";
import { dateLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
      <PageHero
        eyebrow={{ ar: "المدونة", en: "Blog" }}
        title={{ ar: "أفكار تعليمية تقود إلى منتجات جاهزة", en: "Teaching ideas connected to ready-made resources" }}
        description={{
          ar: "مقالات قصيرة تساعد المعلم في شرح الدروس، وفي نهاية كل مقال روابط مباشرة للملفات الجاهزة المرتبطة بالموضوع.",
          en: "Short articles for lesson planning with direct links to relevant ready-made files."
        }}
        motion="library"
      />

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <article key={post.id} className="overflow-hidden rounded-lg border border-pearl-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            {post.coverImage ? <img src={post.coverImage} alt="" className="h-56 w-full object-cover" /> : null}
            <div className="p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-qatar-50 px-3 py-1 text-xs font-black text-qatar-800">
                <BookOpenText size={14} /> {dateLabel(post.createdAt)}
              </div>
              <h2 className="mt-4 text-2xl font-black leading-tight text-zinc-950">{post.title}</h2>
              <p className="mt-3 line-clamp-3 leading-8 text-zinc-600">{post.excerpt}</p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                {post.relatedProduct ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">مرتبط بمنتج جاهز</span>
                ) : <span />}
                <Link href={`/blog/${post.slug}`} className="btn-secondary">
                  قراءة المقال <ArrowLeft size={16} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!posts.length ? (
        <div className="mt-10 rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-600">
          لا توجد مقالات منشورة بعد. أضف مقالات من قاعدة البيانات أو عبر seed.
        </div>
      ) : null}
    </section>
  );
}
