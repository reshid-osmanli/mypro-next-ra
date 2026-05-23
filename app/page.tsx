import Link from "next/link";
import { ArrowLeft, FileText, LibraryBig, Presentation, ShieldCheck } from "lucide-react";
import { Hero } from "@/components/hero";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { LocalizedText } from "@/components/site-preferences";
import { getGrades, getProducts } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/site-settings";

export default async function HomePage() {
  const [featured, grades, settings] = await Promise.all([
    getProducts({ featured: true }),
    getGrades(),
    getSiteSettings()
  ]);

  const formats = [
    {
      icon: Presentation,
      title: { ar: "عروض بوربوينت", en: "PowerPoint decks" },
      text: { ar: "شرائح تعليمية قابلة للتعديل مع نسخ جاهزة للعرض داخل الفصل.", en: "Editable teaching slides with classroom-ready presentation copies." }
    },
    {
      icon: FileText,
      title: { ar: "PDF وDOCX", en: "PDF and DOCX" },
      text: { ar: "أوراق عمل وملفات قابلة للطباعة أو التعديل حسب المادة والصف.", en: "Worksheets and files that can be printed or edited by subject and grade." }
    },
    {
      icon: ShieldCheck,
      title: { ar: "تسليم آمن", en: "Secure delivery" },
      text: { ar: "ملفات خاصة وروابط تحميل مؤقتة بعد إتمام عملية الدفع.", en: "Private files and temporary download links after payment is completed." }
    }
  ];

  return (
    <>
      <Hero
        eyebrow={{ ar: settings.heroEyebrow, en: "Qatari educational platform" }}
        title={{ ar: settings.heroTitle, en: "A professional digital store for PowerPoint lessons and worksheets" }}
        description={{
          ar: settings.heroDescription,
          en: "Kutubi brings a polished storefront, grade-and-subject browsing, and secure checkout for ready digital teaching files."
        }}
        primaryColor={settings.primaryColor}
        secondaryColor={settings.secondaryColor}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { value: `${featured.length || 3}+`, label: { ar: "منتجات مميزة", en: "Featured products" } },
            { value: `${grades.length || 6}+`, label: { ar: "صفوف ومقررات", en: "Grades and courses" } },
            { value: "50MB", label: { ar: "حد رفع لكل ملف", en: "Upload limit per file" } }
          ].map((item) => (
            <div key={item.value} className="rounded-lg border border-pearl-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 h-1 w-14 rounded-md bg-qatar-700" />
              <p className="text-3xl font-black text-zinc-950">{item.value}</p>
              <LocalizedText as="p" className="mt-2 text-sm font-bold text-zinc-500" value={item.label} />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <SectionHeading
          eyebrow={{ ar: "تجربة بيع مكتملة", en: "Complete store flow" }}
          title={{ ar: "متجر ملفات تعليمية يبدو جاهزاً للبيع", en: "A teaching-file store that feels ready to sell" }}
          description={{
            ar: "الواجهة تعرض المنتجات بوضوح، ولوحة الإدارة تربط الصفوف والمواد والملفات والأسعار في مسار واحد قابل للنشر.",
            en: "Products, grades, subjects, files, and prices are presented in a focused flow built for real digital sales."
          }}
          center
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {formats.map(({ icon: Icon, title, text }) => (
            <div key={title.ar} className="rounded-lg border border-pearl-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#2d1820] text-white">
                <Icon size={19} />
              </div>
              <LocalizedText as="h3" className="mt-5 text-xl font-black text-zinc-950" value={title} />
              <LocalizedText as="p" className="mt-3 text-sm leading-7 text-zinc-600" value={text} />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow={{ ar: "المحتوى المميز", en: "Featured content" }}
            title={{ ar: "منتجات تظهر كملفات رقمية حقيقية", en: "Products presented like real digital packs" }}
            description={{
              ar: "بطاقات واضحة مع أغلفة مرئية، تصنيف حسب الصف والمادة، وسعر ظاهر من أول نظرة.",
              en: "Clear cards, visual covers, grade and subject tags, and prices visible at a glance."
            }}
          />
          <Link href="/products" className="btn-secondary">
            <LocalizedText value={{ ar: "عرض كل المنتجات", en: "View all products" }} />
            <ArrowLeft size={16} />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {featured.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="grid gap-6 rounded-lg border border-white/10 bg-[#2d1820] p-6 text-white shadow-[0_24px_80px_rgba(60,32,18,0.2)] lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-black text-white/80">
              <LibraryBig size={14} />
              <LocalizedText value={{ ar: "مكتبة منظمة", en: "Organized library" }} />
            </div>
            <LocalizedText as="h3" className="mt-4 text-2xl font-black" value={{ ar: "صفوف، مواد، وصفحات تعريفية قابلة للتحرير", en: "Editable grades, subjects, and content pages" }} />
            <LocalizedText
              as="p"
              className="mt-3 max-w-2xl text-sm leading-7 text-white/70"
              value={{
                ar: "يمكن إدارة المنتجات، الصفوف، المواد، الصفحات، الأسعار، وصور الأغلفة من لوحة الإدارة دون تعديل الكود.",
                en: "Products, grades, subjects, pages, pricing, and cover images can be managed from the admin panel without code changes."
              }}
            />
          </div>
          <Link href="/library" className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-black text-zinc-950 transition hover:-translate-y-0.5">
            <LocalizedText value={{ ar: "تصفح المكتبة", en: "Browse library" }} />
            <ArrowLeft size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
