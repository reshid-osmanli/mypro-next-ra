import { prisma } from "./db";
import type { Product, ProductCardModel } from "@/components/product-card";

export type CatalogSubject = { id: string; name: string; motionLogo: string | null; sortOrder: number };
export type GradeCatalogItem = { id: string; grade: string; sortOrder: number; subjects: CatalogSubject[] };

export const gradeCatalog = [
  { grade: "الصف الأول", subjects: ["اللغة العربية", "الرياضيات", "العلوم"] },
  { grade: "الصف الثاني", subjects: ["اللغة العربية", "الرياضيات", "العلوم", "اللغة الإنجليزية"] },
  { grade: "الصف الثالث", subjects: ["اللغة العربية", "الرياضيات", "العلوم", "الدراسات الاجتماعية"] },
  { grade: "الصف الرابع", subjects: ["اللغة العربية", "الرياضيات", "الدراسات الاجتماعية", "اللغة الإنجليزية"] },
  { grade: "الصف الخامس", subjects: ["اللغة العربية", "الرياضيات", "العلوم", "اللغة الإنجليزية"] },
  { grade: "الصف السادس", subjects: ["اللغة العربية", "الرياضيات", "الدراسات الاجتماعية", "العلوم"] }
] as const;

async function getDbGradeMap(): Promise<GradeCatalogItem[]> {
  let grades;
  try {
    grades = await prisma.grade.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        subjects: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }
      }
    });
  } catch (error) {
    console.warn("[catalog] Database unavailable for grades", error);
    return [];
  }

  return grades.map((grade) => ({
    id: grade.id,
    grade: grade.name,
    sortOrder: grade.sortOrder,
    subjects: grade.subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      motionLogo: subject.motionLogo,
      sortOrder: subject.sortOrder
    }))
  }));
}

export async function getGradeSubjectMap(): Promise<GradeCatalogItem[]> {
  const dbMap = await getDbGradeMap();
  if (dbMap.length) return dbMap;

  return gradeCatalog.map((item, index) => ({
    id: `seed-grade-${index}`,
    grade: item.grade,
    sortOrder: index,
    subjects: item.subjects.map((subject, subjectIndex) => ({
      id: `seed-${index}-${subjectIndex}`,
      name: subject,
      motionLogo: null,
      sortOrder: subjectIndex
    }))
  }));
}

async function withSubjectMotionLogos<T extends { grade: string; subject: string }>(products: T[]): Promise<Array<T & { subjectMotionLogo: string | null; additionalImages?: string[]; motionEnabled?: boolean; motionPosition?: string | null; motionScale?: number | null; motionRotation?: number | null; motionSrc?: string | null }>> {
  if (!products.length) return [];

  const dbMap = await getDbGradeMap();
  const logoMap = new Map<string, string>();
  for (const grade of dbMap) {
    for (const subject of grade.subjects) {
      if (subject.motionLogo) logoMap.set(`${grade.grade}\u0000${subject.name}`, subject.motionLogo);
    }
  }

  return products.map((product) => ({
    ...product,
    subjectMotionLogo: logoMap.get(`${product.grade}\u0000${product.subject}`) ?? null
  }));
}

export async function getProducts(where?: { grade?: string; subject?: string; featured?: boolean }): Promise<ProductCardModel[]> {
  try {
    const products = (await prisma.product.findMany({
      where: {
        status: "published",
        ...(where?.grade ? { grade: where.grade } : {}),
        ...(where?.subject ? { subject: where.subject } : {}),
        ...(typeof where?.featured === "boolean" ? { featured: where.featured } : {})
      },
      include: { files: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "desc" }, { createdAt: "desc" }]
    })) as ProductCardModel[];
    return withSubjectMotionLogos(products);
  } catch (error) {
    console.warn("[catalog] Database unavailable for products", error);
    return [];
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const products = (await prisma.product.findMany({
      where: { status: "published" },
      include: { files: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "desc" }, { createdAt: "desc" }]
    }));
    return withSubjectMotionLogos(
      products.map((item) => ({
        ...item,
        description: item.description ?? "",
        level: item.level ?? "",
        status: item.status ?? "",
        featured: item.featured ?? false,
        compareAt: item.compareAt ?? null,
        sortOrder: item.sortOrder ?? 0,
        files: Array.isArray(item.files)
          ? item.files.map((file) => ({
              id: file.id,
              title: file.title,
              url: file.url,
              mimeType: file.mimeType ?? "",
              size: file.size ?? 0
            }))
          : []
      }))
    );
  } catch (error) {
    console.warn("[catalog] Database unavailable for all products", error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  const product = (await prisma.product.findUnique({
    where: { slug, status: "published" },
    include: { files: true }
  })) as ProductCardModel | null;
  if (!product) return null;
  const [enriched] = await withSubjectMotionLogos([product]);
  return enriched;
}

export async function getGrades() {
  const items = await getGradeSubjectMap();
  return items.map((item) => item.grade);
}

export async function getSubjects(grade?: string) {
  const items = await getGradeSubjectMap();
  if (grade) return items.find((item) => item.grade === grade)?.subjects.map((subject) => subject.name) ?? [];
  return Array.from(new Set(items.flatMap((item) => item.subjects.map((subject) => subject.name))));
}

export async function getPageByGradeSubject(grade: string, subject: string) {
  return prisma.contentPage.findFirst({ where: { grade, subject, published: true } });
}

export async function getPages() {
  try {
    return await prisma.contentPage.findMany({ orderBy: { updatedAt: "desc" } });
  } catch (error) {
    console.warn("[catalog] Database unavailable for pages", error);
    return [];
  }
}
