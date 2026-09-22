import Link from "next/link";
import { getLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/motion/reveal";
import { gradeCatalog, getGradeSubjectMap } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [dbGradeMap, locale] = await Promise.all([getGradeSubjectMap(), getLocale()]);
  const subjectWord = (count: number) =>
    locale === "en"
      ? count === 1
        ? "subject"
        : "subjects"
      : count === 1
        ? "مادة"
        : count === 2
          ? "مادتان"
          : "مواد";
  const gradeMap = dbGradeMap.length
    ? dbGradeMap.map(({ grade, subjects }) => ({ grade, subjects: subjects.map((subject) => subject.name) }))
    : gradeCatalog.map((item) => ({ grade: item.grade, subjects: [...item.subjects] }));

  return (
    <>
      <PageHeader
        eyebrow={{ ar: "مكتبة الصفوف", en: "Grade library" }}
        title={{ ar: "كل الصفوف مرتبة، وكل مادة لها مسار واضح", en: "Grades organized, every subject with a clear path" }}
        description={{
          ar: "تظهر الصفوف كأقسام مستقلة، وداخل كل صف ستجد المواد التابعة له فقط حتى لا يختلط المحتوى بين المستويات المختلفة.",
          en: "Grades appear as separate sections, and each grade only shows its related subjects."
        }}
        crumbs={[
          { label: { ar: "الرئيسية", en: "Home" }, href: "/" },
          { label: { ar: "المكتبة", en: "Library" } }
        ]}
      />

      <div className="container-content py-10 md:py-12">
        <div className="grid gap-5 md:grid-cols-2">
          {gradeMap.map(({ grade, subjects }, index) => (
            <Reveal key={grade} index={index % 2} className="h-full">
              <Link
                href={`/library/${encodeURIComponent(grade)}`}
                className="card group flex h-full flex-col gap-6 p-6 transition-[border-color,box-shadow,transform] duration-fast ease-standard hover:-translate-y-[2px] hover:border-line-strong hover:shadow-soft md:p-7"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-h2 font-bold text-ink transition-colors duration-instant group-hover:text-brand-deep">
                    {grade}
                  </h2>
                  <span className="tnum text-caption font-semibold text-ink-faint">
                    {subjects.length} {subjectWord(subjects.length)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <span
                      key={subject}
                      className="rounded-pill border border-line bg-surface px-3 py-1 text-caption font-medium text-ink-soft"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}
