import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { LocalizedText } from "@/components/site-preferences";
import { gradeCatalog, getGradeSubjectMap } from "@/lib/catalog";

export default async function LibraryPage() {
  const dbGradeMap = await getGradeSubjectMap();
  const gradeMap = dbGradeMap.length
    ? dbGradeMap.map(({ grade, subjects }) => ({ grade, subjects: subjects.map((subject) => subject.name) }))
    : gradeCatalog.map((item) => ({ grade: item.grade, subjects: [...item.subjects] }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <PageHero
        eyebrow={{ ar: "مكتبة الصفوف", en: "Grade library" }}
        title={{ ar: "كل الصفوف مرتبة وكل مادة لها مسار واضح", en: "Grades are organized, and every subject has a clear path" }}
        description={{
          ar: "تظهر الصفوف كأقسام مستقلة، وداخل كل صف ستجد المواد التابعة له فقط حتى لا يختلط المحتوى بين المستويات المختلفة.",
          en: "Grades appear as separate sections, and each grade only shows its related subjects."
        }}
        motion="library"
      />

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {gradeMap.map(({ grade, subjects }) => (
          <div key={grade} className="overflow-hidden rounded-lg border border-pearl-200 bg-white shadow-[0_18px_50px_rgba(60,32,18,0.05)]">
            <div className="bg-qatar-700 px-6 py-5 text-white">
              <h2 className="text-xl font-black">{grade}</h2>
              <LocalizedText as="p" className="mt-1 text-sm text-white/80" value={{ ar: "صف دراسي مستقل", en: "Separate grade section" }} />
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <Link key={subject} href={`/library/${encodeURIComponent(grade)}/${encodeURIComponent(subject)}`} className="chip">
                    {subject}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
