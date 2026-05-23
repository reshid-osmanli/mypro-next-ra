import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/password";

const prisma = new PrismaClient();

const defaultGrades = [
  { name: "الصف الأول", subjects: ["اللغة العربية", "الرياضيات", "العلوم"] },
  { name: "الصف الثاني", subjects: ["اللغة العربية", "الرياضيات", "العلوم", "اللغة الإنجليزية"] },
  { name: "الصف الثالث", subjects: ["اللغة العربية", "الرياضيات", "العلوم", "الدراسات الاجتماعية"] },
  { name: "الصف الرابع", subjects: ["اللغة العربية", "الرياضيات", "الدراسات الاجتماعية", "اللغة الإنجليزية"] },
  { name: "الصف الخامس", subjects: ["اللغة العربية", "الرياضيات", "العلوم", "اللغة الإنجليزية"] },
  { name: "الصف السادس", subjects: ["اللغة العربية", "الرياضيات", "الدراسات الاجتماعية", "العلوم"] }
];

async function main() {
  await prisma.productFile.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.contentPage.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.product.deleteMany();
  await prisma.adminUser.deleteMany();

  for (let i = 0; i < defaultGrades.length; i += 1) {
    const grade = defaultGrades[i];
    const created = await prisma.grade.create({ data: { name: grade.name, sortOrder: i } });
    for (let j = 0; j < grade.subjects.length; j += 1) {
      await prisma.subject.create({ data: { gradeId: created.id, name: grade.subjects[j], sortOrder: j } });
    }
  }

  await prisma.product.createMany({
    data: [
      {
        slug: "grade1-arabic-lettering",
        title: "عروض بوربوينت اللغة العربية للصف الأول",
        excerpt: "شرائح متحركة ومبسطة لتعليم الحروف والكلمات الأولى.",
        description: "باقة تعليمية فاخرة مهيأة للتدريس داخل الصف، مع انتقالات ناعمة، وواجهات قراءة واضحة، وشرائح قابلة للتعديل بالكامل.",
        price: 49,
        compareAt: 89,
        badge: "الأكثر طلبًا",
        grade: "الصف الأول",
        subject: "اللغة العربية",
        category: "بوربوينت",
        format: "PPTX + PDF",
        pages: "32 شريحة",
        level: "المرحلة الابتدائية",
        featured: true,
        accentA: "#8a1538",
        accentB: "#5f1029"
      },
      {
        slug: "grade1-math-basics",
        title: "مهارات الرياضيات للصف الأول",
        excerpt: "تدريبات تفاعلية لتثبيت العد والجمع الأولي.",
        description: "ملف مخصص لبناء مهارات أساسية مع بطاقات منظمة ونمط بصري جميل جدًا، مناسب للبيع والطباعة.",
        price: 37,
        compareAt: 55,
        badge: "تفاعلي",
        grade: "الصف الأول",
        subject: "الرياضيات",
        category: "ورقة عمل",
        format: "PDF + DOCX",
        pages: "20 صفحة",
        level: "المرحلة الابتدائية",
        featured: false,
        accentA: "#6b0f2b",
        accentB: "#0f172a"
      },
      {
        slug: "grade2-science-worksheets",
        title: "أوراق عمل العلوم للصف الثاني",
        excerpt: "تمارين منظمة جاهزة للطباعة مع إجابات مختصرة.",
        description: "أوراق عمل تراعي التدرج في الصعوبة وتناسب الطباعة والإرسال الرقمي، مع تصميم نظيف ومريح للعين.",
        price: 35,
        compareAt: 55,
        badge: "جاهز للطباعة",
        grade: "الصف الثاني",
        subject: "العلوم",
        category: "ورقة عمل",
        format: "PDF + DOCX",
        pages: "24 صفحة",
        level: "المرحلة الابتدائية",
        featured: true,
        accentA: "#0f172a",
        accentB: "#8a1538"
      }
    ]
  });

  await prisma.siteSetting.createMany({
    data: [
      { key: "brandName", value: "موقع كُتبي" },
      { key: "supportEmail", value: "support@kutubi.qa" },
      { key: "supportPhone", value: "+974 0000 0000" },
      { key: "whatsapp", value: "+974 0000 0000" },
      { key: "heroEyebrow", value: "منصة تعليمية قطرية" },
      { key: "heroTitle", value: "متجر رقمي احترافي لبيع عروض البوربوينت وأوراق العمل" },
      { key: "heroDescription", value: "منصة كُتبي تجمع بين واجهة جذابة، مكتبة مرتبة حسب الصف والمادة، ولوحة إدارة آمنة لرفع الملفات وتسعير المنتجات." },
      { key: "checkoutNote", value: "الملفات الرقمية تُسلّم مباشرة بعد الدفع عبر روابط تحميل مؤقتة وآمنة." },
      { key: "primaryColor", value: "#8a1538" },
      { key: "secondaryColor", value: "#0f766e" }
    ]
  });

  await prisma.contentPage.createMany({
    data: [
      {
        slug: "grade1-arabic",
        grade: "الصف الأول",
        subject: "اللغة العربية",
        title: "صفحة اللغة العربية للصف الأول",
        intro: "صفحة منسقة تلقائيًا تعرض جميع العروض والملفات الخاصة بهذا الصف والمادة.",
        body: "هنا يمكنك عرض المنتجات المرتبطة بنفس الصف والمادة، مع تصنيف واضح، وسلة، وأزرار شراء، وصفحة تعريفية قابلة للتعديل من لوحة الإدارة.",
        heroLabel: "صفحة صف ومادة"
      }
    ]
  });

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL is required for seeding the admin user");
  }

  if (!adminPasswordHash && !adminPassword) {
    throw new Error("Either ADMIN_PASSWORD_HASH or ADMIN_PASSWORD is required for seeding the admin user");
  }

  await prisma.adminUser.create({
    data: {
      email: adminEmail.toLowerCase(),
      passwordHash: adminPasswordHash || hashPassword(adminPassword!),
      role: "admin",
      active: true
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
