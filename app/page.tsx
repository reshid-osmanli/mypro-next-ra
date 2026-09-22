import Link from "next/link";
import { Download, FileSearch, ShieldCheck } from "lucide-react";
import { getLocale } from "next-intl/server";
import { Hero } from "@/components/marketing/hero";
import { FeaturedSection } from "@/components/marketing/featured-feature";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { ArrowForward } from "@/components/ui/icon";
import { getBlogPosts } from "@/lib/blog";
import { getGradeSubjectMap, getAllProducts } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

type L = { ar: string; en: string };

const steps: { icon: typeof FileSearch; title: L; text: L }[] = [
  {
    icon: FileSearch,
    title: { ar: "اختر ما يناسب صفك", en: "Pick what fits your class" },
    text: { ar: "تصفح حسب الصف والمادة، واعرض الغلاف والتفاصيل قبل الشراء.", en: "Browse by grade and subject, and inspect the cover and details before you buy." }
  },
  {
    icon: ShieldCheck,
    title: { ar: "ادفع بأمان", en: "Pay securely" },
    text: { ar: "Stripe أو PayPal — دفع آمن وموثق دون مشاركة بياناتك مع طرف ثالث.", en: "Stripe or PayPal — secure, documented checkout with no third-party sharing." }
  },
  {
    icon: Download,
    title: { ar: "حمّل فورًا", en: "Download instantly" },
    text: { ar: "بعد الدفع تجد ملفاتك في “مشترياتي” بروابط تحميل خاصة.", en: "After payment your files appear in “My purchases” with private download links." }
  }
];

export default async function HomePage() {
  const [allProducts, gradeMap, settings, posts, locale] = await Promise.all([
    getAllProducts(),
    getGradeSubjectMap(),
    getSiteSettings(),
    getBlogPosts(),
    getLocale()
  ]);
  const local = (value: L) => (locale === "en" ? value.en : value.ar);
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ar", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const featured = allProducts.filter((product) => product.featured).slice(0, 3);
  const heroProducts = featured.length >= 3 ? featured : allProducts.slice(0, 3);
  const featuredIds = new Set(featured.slice(0, 3).map((item) => item.id));
  const restForGrid = allProducts.filter((product) => !featuredIds.has(product.id));
  const shownLatest = (restForGrid.length >= 4 ? restForGrid : allProducts).slice(0, 8);

  const productCountByGrade = new Map<string, number>();
  for (const product of allProducts) {
    productCountByGrade.set(product.grade, (productCountByGrade.get(product.grade) ?? 0) + 1);
  }

  return (
    <>
      <Hero
        eyebrow={{ ar: settings.heroEyebrow, en: "Qatari educational platform" }}
        title={{ ar: settings.heroTitle, en: "A professional digital store for PowerPoint lessons and worksheets" }}
        description={{
          ar: settings.heroDescription,
          en: "Kutubi brings a polished storefront, grade-and-subject browsing, and secure checkout for ready digital teaching files."
        }}
        primaryCtaLabel={{ ar: settings.heroPrimaryCtaLabel, en: "Browse products" }}
        primaryCtaHref={settings.heroPrimaryCtaHref}
        secondaryCtaLabel={{ ar: settings.heroSecondaryCtaLabel, en: "View library" }}
        secondaryCtaHref={settings.heroSecondaryCtaHref}
        products={heroProducts}
      />

      {/* announcement — quiet strip */}
      {settings.announcementEnabled === "true" && settings.announcementText ? (
        <Link
          href={settings.announcementHref}
          className="block border-b border-line bg-brand-soft/50 transition-colors duration-instant hover:bg-brand-soft"
        >
          <span className="container-wide flex items-center justify-center gap-2 py-2.5 text-center text-body-sm font-semibold text-brand-deep">
            {settings.announcementText}
            <ArrowForward size={14} aria-hidden="true" />
          </span>
        </Link>
      ) : null}

      {/* featured — editorial spread */}
      {featured.length > 0 ? (
        <section className="section">
          <div className="container-content">
            <SectionHeading
              eyebrow={{ ar: "من المختارات", en: "Featured" }}
              title={{ ar: "حزم جاهزة تبدأ منها صفك", en: "Ready packs to start your class" }}
              description={{
                ar: "نخبة من العروض وأوراق العمل المنظمة حسب الصف والمادة، بأسعار واضحة وملفات موثقة.",
                en: "A selection of organized decks and worksheets, with clear pricing and documented files."
              }}
              action={{ href: "/products", label: { ar: "كل المنتجات", en: "All products" } }}
            />
            <FeaturedSection products={featured} />
          </div>
        </section>
      ) : null}

      {/* browse by grade */}
      <section className="border-y border-line bg-paper-deep/40">
        <div className="container-content py-14 md:py-16">
          <SectionHeading
            eyebrow={{ ar: "المكتبة", en: "Library" }}
            title={{ ar: "تصفح حسب الصف الدراسي", en: "Browse by grade" }}
            description={{
              ar: "كل صف يحمل موادّه المستقلة، دون اختلاط بين المستويات.",
              en: "Each grade keeps its own subjects, no mixing between levels."
            }}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {gradeMap.map(({ grade, subjects }, index) => (
              <Reveal key={grade} index={index} className="h-full">
                <Link
                  href={`/library/${encodeURIComponent(grade)}`}
                  className="card group flex h-full flex-col justify-between gap-6 p-5 transition-[border-color,box-shadow,transform] duration-fast ease-standard hover:-translate-y-[2px] hover:border-line-strong hover:shadow-soft"
                >
                  <div>
                    <span className="tnum text-label font-bold text-brand-deep">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-2 text-h4 font-bold text-ink transition-colors duration-instant group-hover:text-brand-deep">
                      {grade}
                    </h3>
                  </div>
                  <p className="text-caption text-ink-faint">
                    {subjects.length}{" "}
                    {local({ ar: subjects.length === 1 ? "مادة" : "مواد", en: subjects.length === 1 ? "subject" : "subjects" })}
                    {productCountByGrade.get(grade)
                      ? ` · ${productCountByGrade.get(grade)}+ ${local({ ar: "منتج", en: "products" })}`
                      : ""}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* latest products grid */}
      {shownLatest.length > 0 ? (
        <section className="section">
          <div className="container-content">
            <SectionHeading
              eyebrow={{ ar: "وصل حديثًا", en: "Latest" }}
              title={{ ar: "أحدث الموارد التعليمية", en: "Latest teaching resources" }}
              action={{ href: "/products", label: { ar: "عرض الكل", en: "View all" } }}
            />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shownLatest.map((product, index) => (
                <Reveal key={product.id} index={index % 4} className="h-full">
                  <ProductCard product={product} className="h-full" />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* how it works — quiet text strip */}
      <section className="border-t border-line bg-paper">
        <div className="container-content py-14 md:py-16">
          <SectionHeading
            eyebrow={{ ar: "كيف تعمل؟", en: "How it works" }}
            title={{ ar: "من الاختيار إلى التحميل في ثلاث خطوات", en: "From picking to downloading in three steps" }}
          />
          <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
            {steps.map(({ icon: IconComponent, title, text: stepText }, index) => (
              <Reveal key={title.ar} index={index} as="li">
                <div className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-sm border border-line bg-surface text-brand">
                    <IconComponent size={19} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-h4 font-bold text-ink">
                      <span className="tnum me-2 text-ink-faint">{String(index + 1).padStart(2, "0")}</span>
                      {local(title)}
                    </h3>
                    <p className="mt-1.5 text-body-sm leading-8 text-ink-soft">{local(stepText)}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* blog preview */}
      {posts.length > 0 ? (
        <section className="border-t border-line">
          <div className="container-content py-14 md:py-16">
            <SectionHeading
              eyebrow={{ ar: "المدونة", en: "Blog" }}
              title={{ ar: "أفكار تدريس مرتبطة بملفات جاهزة", en: "Teaching ideas linked to ready files" }}
              action={{ href: "/blog", label: { ar: "كل المقالات", en: "All articles" } }}
            />
            <div className="grid gap-6 md:grid-cols-2">
              {posts.slice(0, 2).map((post, index) => (
                <Reveal key={post.id} index={index} className="h-full">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="card group flex h-full flex-col p-6 transition-[border-color,box-shadow] duration-fast ease-standard hover:border-line-strong hover:shadow-soft md:p-7"
                  >
                    <p className="text-caption text-ink-faint">{dateFmt.format(new Date(post.createdAt))}</p>
                    <h3 className="mt-3 text-h3 font-bold leading-snug text-ink transition-colors duration-instant group-hover:text-brand-deep">
                      {post.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-body-sm leading-8 text-ink-soft">{post.excerpt}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-body-sm font-semibold text-brand-deep">
                      {local({ ar: "قراءة المقال", en: "Read article" })}
                      <ArrowForward size={14} className="transition-transform duration-fast ease-standard group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
