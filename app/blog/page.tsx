import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { getLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/motion/reveal";
import { ArrowForward } from "@/components/ui/icon";
import { getBlogPosts } from "@/lib/blog";
import { dateLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const [posts, locale] = await Promise.all([getBlogPosts(), getLocale()]);
  const local = (value: { ar: string; en: string }) => (locale === "en" ? value.en : value.ar);

  return (
    <>
      <PageHeader
        eyebrow={{ ar: "المدونة", en: "Blog" }}
        title={{ ar: "أفكار تعليمية تقود إلى ملفات جاهزة", en: "Teaching ideas connected to ready files" }}
        description={{
          ar: "مقالات قصيرة تساعد المعلم في شرح الدروس، وفي نهاية كل مقال روابط مباشرة للملفات الجاهزة المرتبطة بالموضوع.",
          en: "Short articles for lesson planning with direct links to relevant ready-made files."
        }}
        crumbs={[
          { label: local({ ar: "الرئيسية", en: "Home" }), href: "/" },
          { label: local({ ar: "المدونة", en: "Blog" }) }
        ]}
      />

      <div className="container-content py-10 md:py-12">
        {posts.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post, index) => (
              <Reveal key={post.id} index={index % 2} className="h-full">
                <Link
                  href={`/blog/${post.slug}`}
                  className="card group flex h-full flex-col overflow-hidden transition-[border-color,box-shadow] duration-fast ease-standard hover:border-line-strong hover:shadow-soft"
                >
                  {post.coverImage ? (
                    <div className="aspect-[2/1] w-full overflow-hidden bg-paper-deep/50">
                      <img src={post.coverImage} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-6 md:p-7">
                    <p className="inline-flex items-center gap-2 text-caption font-medium text-ink-faint">
                      <BookOpenText size={14} aria-hidden="true" />
                      {dateLabel(post.createdAt)}
                    </p>
                    <h2 className="mt-3 text-h3 font-bold leading-snug text-ink transition-colors duration-instant group-hover:text-brand-deep">
                      {post.title}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-body-sm leading-8 text-ink-soft">{post.excerpt}</p>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                      {post.relatedProduct ? (
                        <Badge tone="teal">{local({ ar: "مرتبط بمنتج جاهز", en: "Linked to a product" })}</Badge>
                      ) : (
                        <span />
                      )}
                      <span className="inline-flex items-center gap-2 text-body-sm font-semibold text-brand-deep">
                        {local({ ar: "قراءة المقال", en: "Read article" })}
                        <ArrowForward size={14} className="transition-transform duration-fast ease-standard group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpenText}
            title={local({ ar: "لا توجد مقالات منشورة بعد", en: "No published articles yet" })}
            description={local({
              ar: "أضف مقالات من لوحة التحكم لتظهر هنا.",
              en: "Add articles from the admin panel to see them here."
            })}
          />
        )}
      </div>
    </>
  );
}
