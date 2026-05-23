"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  BookText,
  FolderUp,
  Layers3,
  PencilLine,
  PlusCircle,
  Sparkles,
  Settings2,
  Trash2,
  UploadCloud,
  PackageSearch
} from "lucide-react";
import { currencyLabel, formatBytes } from "@/lib/utils";
import { describeAllowedPrivateUploads, MAX_UPLOAD_BYTES, PRIVATE_UPLOAD_ACCEPT } from "@/lib/upload-policy";
import type { ProductCardModel } from "./product-card";

type Product = ProductCardModel & {
  description: string;
  level: string;
  status: string;
  featured: boolean;
  compareAt: number | null;
  sortOrder: number;
  files?: { id: string; title: string; url: string; mimeType: string; size: number }[];
};

type PageItem = {
  id: string;
  slug: string;
  grade: string;
  subject: string;
  title: string;
  intro: string;
  body: string;
  heroLabel: string;
  published: boolean;
};

type CatalogSubject = { id: string; name: string; motionLogo: string | null; sortOrder: number };
type CatalogGrade = { id: string; grade: string; sortOrder: number; subjects: CatalogSubject[] };

type SiteSettings = {
  brandName: string;
  supportEmail: string;
  supportPhone: string;
  whatsapp: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  checkoutNote: string;
  primaryColor: string;
  secondaryColor: string;
};

type Props = {
  products: Product[];
  pages: PageItem[];
  catalog: CatalogGrade[];
  settings: SiteSettings;
};

type ProductFormState = {
  title: string;
  excerpt: string;
  description: string;
  price: number;
  compareAt: number;
  badge: string;
  grade: string;
  subject: string;
  category: string;
  format: string;
  pages: string;
  level: string;
  featured: boolean;
  status: string;
  accentA: string;
  accentB: string;
  coverImage: string;
  sortOrder: number;
};

type PageFormState = { grade: string; subject: string; title: string; intro: string; body: string; heroLabel: string; published: boolean };
type GradeFormState = { name: string; sortOrder: number };
type SubjectFormState = { gradeId: string; name: string; motionLogo: string; sortOrder: number };

const PUBLIC_IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,.gif";

const productDefaults: ProductFormState = {
  title: "",
  excerpt: "",
  description: "",
  price: 0,
  compareAt: 0,
  badge: "جديد",
  grade: "الصف الأول",
  subject: "اللغة العربية",
  category: "بوربوينت",
  format: "PPTX",
  pages: "10 صفحات",
  level: "المرحلة الابتدائية",
  featured: true,
  status: "published",
  accentA: "#8a1538",
  accentB: "#0f766e",
  coverImage: "",
  sortOrder: 0
};

const pageDefaults: PageFormState = {
  grade: "الصف الأول",
  subject: "اللغة العربية",
  title: "",
  intro: "",
  body: "",
  heroLabel: "صفحة مادة",
  published: true
};

const tabs = [
  { id: "products", label: "المنتجات", icon: PackageSearch },
  { id: "grades", label: "الصفوف والمواد", icon: Layers3 },
  { id: "pages", label: "صفحات المواد", icon: BookText },
  { id: "uploads", label: "رفع الملفات", icon: UploadCloud },
  { id: "pricing", label: "التسعير السريع", icon: BadgeDollarSign },
  { id: "settings", label: "الإعدادات", icon: Settings2 }
] as const;

function AdminDashboard({ products, pages, catalog, settings }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("products");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [productForm, setProductForm] = useState<ProductFormState>(productDefaults);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ title: string; url: string; mimeType: string; size: number }[]>([]);

  const [pageForm, setPageForm] = useState<PageFormState>(pageDefaults);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  const [gradeForm, setGradeForm] = useState<GradeFormState>({ name: "", sortOrder: 0 });
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState<SubjectFormState>({ gradeId: catalog[0]?.id ?? "", name: "", motionLogo: "", sortOrder: 0 });
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);

  const [priceDrafts, setPriceDrafts] = useState<Record<string, { price: string; compareAt: string; featured: boolean; status: string; sortOrder: string }>>(
    Object.fromEntries(products.map((product) => [product.id, { price: String(product.price), compareAt: product.compareAt ? String(product.compareAt) : "", featured: product.featured, status: product.status, sortOrder: String(product.sortOrder ?? 0) }]))
  );

  useEffect(() => {
    if (!subjectForm.gradeId && catalog[0]?.id) setSubjectForm((c) => ({ ...c, gradeId: catalog[0].id }));
  }, [catalog, subjectForm.gradeId]);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const gradeOptions = catalog.map((item) => item.grade);
  const subjectsForProduct = useMemo(() => catalog.find((item) => item.grade === productForm.grade)?.subjects.map((s) => s.name) ?? [], [catalog, productForm.grade]);
  const subjectsForPage = useMemo(() => catalog.find((item) => item.grade === pageForm.grade)?.subjects.map((s) => s.name) ?? [], [catalog, pageForm.grade]);
  const groupedProducts = useMemo(() => catalog.map((item) => ({ grade: item.grade, items: products.filter((product) => product.grade === item.grade) })).filter((group) => group.items.length > 0), [products, catalog]);
  const selectedGrade = useMemo(() => catalog.find((item) => item.id === subjectForm.gradeId) ?? catalog[0], [catalog, subjectForm.gradeId]);

  function resetProductForm() { setProductForm(productDefaults); setEditingProductId(null); }
  function resetPageForm() { setPageForm(pageDefaults); setEditingPageId(null); }
  function resetGradeForm() { setGradeForm({ name: "", sortOrder: 0 }); setEditingGradeId(null); }
  function resetSubjectForm() { setSubjectForm({ gradeId: catalog[0]?.id ?? "", name: "", motionLogo: "", sortOrder: 0 }); setEditingSubjectId(null); }

  async function saveProduct() {
    if (!productForm.title.trim() || !productForm.excerpt.trim() || !productForm.description.trim()) {
      setMessage("املأ العنوان والملخص والوصف قبل الحفظ");
      return;
    }
    setBusy(true); setMessage("");
    try {
      const res = await fetch(editingProductId ? `/api/admin/products/${editingProductId}` : "/api/admin/products", {
        method: editingProductId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...productForm, files: uploadedFiles })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر حفظ المنتج");
      setMessage(editingProductId ? "تم تحديث المنتج" : "تم حفظ المنتج بنجاح");
      resetProductForm(); setUploadedFiles([]);
      setTimeout(() => router.refresh(), 700);
    } catch (error) { setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع"); }
    finally { setBusy(false); }
  }

  async function deleteProduct(id: string) {
    if (!confirm("هل تريد حذف هذا المنتج؟")) return;
    setBusy(true); setMessage("");
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر حذف المنتج");
      if (editingProductId === id) resetProductForm();
      setMessage("تم حذف المنتج");
      setTimeout(() => router.refresh(), 400);
    } catch (error) { setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع"); }
    finally { setBusy(false); }
  }

  function startEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProductForm({ title: product.title, excerpt: product.excerpt, description: product.description, price: product.price, compareAt: product.compareAt ?? 0, badge: product.badge, grade: product.grade, subject: product.subject, category: product.category, format: product.format, pages: product.pages, level: product.level, featured: product.featured, status: product.status, accentA: product.accentA, accentB: product.accentB, coverImage: product.coverImage ?? "", sortOrder: product.sortOrder ?? 0 });
    setTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function savePage() {
    if (!pageForm.title.trim() || !pageForm.intro.trim() || !pageForm.body.trim()) {
      setMessage("املأ عنوان الصفحة والتمهيد والنص التفصيلي قبل الحفظ");
      return;
    }
    setBusy(true); setMessage("");
    try {
      const res = await fetch(editingPageId ? `/api/admin/pages/${editingPageId}` : "/api/admin/pages", {
        method: editingPageId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر حفظ الصفحة");
      resetPageForm(); setMessage(editingPageId ? "تم تحديث الصفحة" : "تم إنشاء صفحة المادة بنجاح"); setTimeout(() => router.refresh(), 700);
    } catch (error) { setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع"); }
    finally { setBusy(false); }
  }

  async function deletePage(id: string) {
    if (!confirm("هل تريد حذف هذه الصفحة؟")) return;
    setBusy(true); setMessage("");
    try {
      const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر حذف الصفحة");
      if (editingPageId === id) resetPageForm();
      setMessage("تم حذف الصفحة");
      setTimeout(() => router.refresh(), 400);
    } catch (error) { setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع"); }
    finally { setBusy(false); }
  }

  function startEditPage(page: PageItem) {
    setEditingPageId(page.id);
    setPageForm({ grade: page.grade, subject: page.subject, title: page.title, intro: page.intro, body: page.body, heroLabel: page.heroLabel, published: page.published });
    setTab("pages");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveGrade() {
    if (!gradeForm.name.trim()) {
      setMessage("أدخل اسم الصف قبل الحفظ");
      return;
    }
    setBusy(true); setMessage("");
    try {
      const res = await fetch(editingGradeId ? `/api/admin/grades/${editingGradeId}` : "/api/admin/grades", {
        method: editingGradeId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gradeForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر حفظ الصف");
      resetGradeForm(); setMessage(editingGradeId ? "تم تحديث الصف" : "تم إضافة الصف"); setTimeout(() => router.refresh(), 700);
    } catch (error) { setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع"); }
    finally { setBusy(false); }
  }

  async function deleteGrade(id: string) {
    if (!confirm("حذف الصف سيؤثر على المحتوى المرتبط. هل أنت متأكد؟")) return;
    setBusy(true); setMessage("");
    try {
      const res = await fetch(`/api/admin/grades/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر حذف الصف");
      if (editingGradeId === id) resetGradeForm();
      setMessage("تم حذف الصف");
      setTimeout(() => router.refresh(), 400);
    } catch (error) { setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع"); }
    finally { setBusy(false); }
  }

  function startEditGrade(item: CatalogGrade) { setEditingGradeId(item.id); setGradeForm({ name: item.grade, sortOrder: item.sortOrder }); setTab("grades"); }

  async function saveSubject() {
    if (!selectedGrade) return;
    if (!subjectForm.name.trim()) {
      setMessage("أدخل اسم المادة قبل الحفظ");
      return;
    }
    setBusy(true); setMessage("");
    try {
      const res = await fetch(editingSubjectId ? `/api/admin/subjects/${editingSubjectId}` : `/api/admin/grades/${subjectForm.gradeId}/subjects`, {
        method: editingSubjectId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: subjectForm.name, motionLogo: subjectForm.motionLogo, sortOrder: subjectForm.sortOrder })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر حفظ المادة");
      resetSubjectForm(); setMessage(editingSubjectId ? "تم تحديث المادة" : "تم إضافة المادة"); setTimeout(() => router.refresh(), 700);
    } catch (error) { setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع"); }
    finally { setBusy(false); }
  }

  async function deleteSubject(id: string) {
    if (!confirm("حذف المادة قد يؤثر على المحتوى المرتبط بها. هل أنت متأكد؟")) return;
    setBusy(true); setMessage("");
    try {
      const res = await fetch(`/api/admin/subjects/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر حذف المادة");
      if (editingSubjectId === id) resetSubjectForm();
      setMessage("تم حذف المادة");
      setTimeout(() => router.refresh(), 400);
    } catch (error) { setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع"); }
    finally { setBusy(false); }
  }

  function startEditSubject(gradeId: string, subject: CatalogSubject) { setEditingSubjectId(subject.id); setSubjectForm({ gradeId, name: subject.name, motionLogo: subject.motionLogo ?? "", sortOrder: subject.sortOrder }); setTab("grades"); }

  async function savePrice(productId: string) {
    const draft = priceDrafts[productId];
    if (!draft) return;
    setBusy(true); setMessage("");
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: Number(draft.price), compareAt: draft.compareAt ? Number(draft.compareAt) : null, featured: draft.featured, status: draft.status, sortOrder: Number(draft.sortOrder || 0) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر حفظ السعر");
      setMessage("تم تحديث التسعير");
      setTimeout(() => router.refresh(), 700);
    } catch (error) { setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع"); }
    finally { setBusy(false); }
  }

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const tooLarge = Array.from(fileList).find((file) => file.size > MAX_UPLOAD_BYTES);
    if (tooLarge) {
      setMessage(`حجم ${tooLarge.name} يتجاوز الحد الأقصى ${formatBytes(MAX_UPLOAD_BYTES)}`);
      return;
    }
    setBusy(true); setMessage("");
    try {
      const results: typeof uploadedFiles = [];
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/uploads", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "فشل الرفع");
        if (!data.private) throw new Error("مرفقات المنتج يجب أن تحفظ في التخزين الخاص");
        results.push({ title: file.name, url: data.url as string, mimeType: data.mimeType as string, size: file.size });
      }
      setUploadedFiles((current) => [...current, ...results]);
      setMessage("تم رفع الملفات وربطها مؤقتًا بالمنتج القادم");
    } catch (error) { setMessage(error instanceof Error ? error.message : "حدث خطأ أثناء الرفع"); }
    finally { setBusy(false); }
  }
  async function uploadCoverImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("يرجى اختيار صورة فقط لصورة الغلاف");
      return;
    }
    setBusy(true); setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل رفع صورة الغلاف");
      setProductForm((current) => ({ ...current, coverImage: data.url as string }));
      setMessage("تم رفع صورة الغلاف بنجاح");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ أثناء رفع صورة الغلاف");
    } finally {
      setBusy(false);
    }
  }

  async function uploadSubjectMotionLogo(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("يرجى اختيار صورة أو شعار متحرك بصيغة صورة فقط");
      return;
    }
    setBusy(true); setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل رفع شعار المادة");
      if (data.private) throw new Error("شعار المادة يجب أن يكون صورة عامة قابلة للعرض");
      setSubjectForm((current) => ({ ...current, motionLogo: data.url as string }));
      setMessage("تم رفع شعار المادة المتحرك بنجاح");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ أثناء رفع شعار المادة");
    } finally {
      setBusy(false);
    }
  }


  async function saveSettings() {
    setBusy(true); setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر حفظ الإعدادات");
      setSettingsForm(data.settings);
      setMessage("تم حفظ الإعدادات بنجاح");
      setTimeout(() => router.refresh(), 700);
    } catch (error) { setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع"); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-[linear-gradient(135deg,#fff,#f7f8f5_60%,#fff)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#8a1538,#0f766e,#d89b32)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-qatar-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-qatar-800">
              <Layers3 size={14} />
              لوحة منشئ مستقلة
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">إدارة المنتجات والصفوف والمواد والملفات</h1>
            <p className="mt-3 max-w-3xl leading-8 text-zinc-600">كل ميزة هنا تعمل فعليًا: إضافة، تعديل، حذف، تنظيم الصفوف والمواد، ورفع الملفات وربطها بالمنتجات.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "المنتجات", value: products.length.toString(), icon: Layers3 },
              { label: "الصفحات", value: pages.length.toString(), icon: BookText },
              { label: "الصفوف", value: catalog.length.toString(), icon: Layers3 },
              { label: "الملفات المرفوعة", value: uploadedFiles.length.toString(), icon: FolderUp }
            ].map((item) => (
              <motion.div key={item.label} whileHover={{ y: -3 }} className="rounded-[1.4rem] border border-white/70 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
                <item.icon className="text-qatar-700" size={18} />
                <p className="mt-3 text-sm text-zinc-500">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-qatar-800">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-qatar-100 bg-white/80 p-2 shadow-[0_12px_30px_rgba(15,23,42,0.04)] backdrop-blur">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`inline-flex items-center gap-2 rounded-[1.2rem] px-4 py-3 text-sm font-semibold transition ${active ? "bg-qatar-700 text-white shadow-[0_12px_35px_rgba(138,21,56,0.22)]" : "text-zinc-700 hover:bg-zinc-50"}`}>
              <item.icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      {message ? <div className="rounded-[1.4rem] border border-qatar-100 bg-white px-5 py-4 text-sm text-zinc-700 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">{message}</div> : null}

      {tab === "products" ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="panel space-y-5 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-zinc-950">{editingProductId ? "تعديل المنتج" : "إضافة منتج جديد"}</h3>
                <p className="mt-1 text-sm text-zinc-500">اختر الصف ثم المادة حتى يبقى كل محتوى في مكانه الصحيح.</p>
              </div>
              {editingProductId ? <button type="button" onClick={resetProductForm} className="chip">إلغاء التعديل</button> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">عنوان المنتج</span><input className="input" value={productForm.title} onChange={(e) => setProductForm((c) => ({ ...c, title: e.target.value }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">السعر</span><input className="input" type="number" value={productForm.price} onChange={(e) => setProductForm((c) => ({ ...c, price: Number(e.target.value) }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">السعر قبل الخصم</span><input className="input" type="number" value={productForm.compareAt} onChange={(e) => setProductForm((c) => ({ ...c, compareAt: Number(e.target.value) }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">شارة المنتج</span><input className="input" value={productForm.badge} onChange={(e) => setProductForm((c) => ({ ...c, badge: e.target.value }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">الصف</span><select className="input" value={productForm.grade} onChange={(e) => setProductForm((c) => ({ ...c, grade: e.target.value, subject: catalog.find((g) => g.grade === e.target.value)?.subjects[0]?.name ?? c.subject }))}>{gradeOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">المادة</span><select className="input" value={productForm.subject} onChange={(e) => setProductForm((c) => ({ ...c, subject: e.target.value }))}>{subjectsForProduct.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">التصنيف</span><input className="input" value={productForm.category} onChange={(e) => setProductForm((c) => ({ ...c, category: e.target.value }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">الصيغة</span><input className="input" value={productForm.format} onChange={(e) => setProductForm((c) => ({ ...c, format: e.target.value }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">عدد الصفحات</span><input className="input" value={productForm.pages} onChange={(e) => setProductForm((c) => ({ ...c, pages: e.target.value }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">المستوى</span><input className="input" value={productForm.level} onChange={(e) => setProductForm((c) => ({ ...c, level: e.target.value }))} /></label>
              <label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold text-zinc-700">الملخص</span><input className="input" value={productForm.excerpt} onChange={(e) => setProductForm((c) => ({ ...c, excerpt: e.target.value }))} /></label>
              <label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold text-zinc-700">الوصف التفصيلي</span><textarea className="textarea" value={productForm.description} onChange={(e) => setProductForm((c) => ({ ...c, description: e.target.value }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">الترتيب</span><input className="input" type="number" value={productForm.sortOrder} onChange={(e) => setProductForm((c) => ({ ...c, sortOrder: Number(e.target.value) }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">الحالة</span><select className="input" value={productForm.status} onChange={(e) => setProductForm((c) => ({ ...c, status: e.target.value }))}><option value="published">منشور</option><option value="draft">مسودة</option></select></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">لون أول</span><input className="input" value={productForm.accentA} onChange={(e) => setProductForm((c) => ({ ...c, accentA: e.target.value }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">لون ثانٍ</span><input className="input" value={productForm.accentB} onChange={(e) => setProductForm((c) => ({ ...c, accentB: e.target.value }))} /></label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-semibold text-zinc-700">صورة الغلاف / المعاينة</span>
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                  <input
                    className="input"
                    value={productForm.coverImage}
                    onChange={(e) => setProductForm((c) => ({ ...c, coverImage: e.target.value }))}
                    placeholder="/uploads/cover-image.jpg"
                  />
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-qatar-200 bg-white px-4 py-3 text-sm font-semibold text-qatar-800 transition hover:bg-qatar-50">
                    <UploadCloud size={16} /> رفع صورة
                    <input type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => uploadCoverImage(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                {productForm.coverImage ? (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-qatar-100 bg-zinc-50">
                    <img src={productForm.coverImage} alt="معاينة صورة الغلاف" className="h-52 w-full object-cover" />
                  </div>
                ) : null}
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={busy} onClick={saveProduct} className="btn-primary disabled:opacity-60"><PlusCircle size={16} />{editingProductId ? "حفظ التعديلات" : "حفظ المنتج"}</button>
              <button type="button" onClick={resetProductForm} className="btn-secondary">إعادة ضبط</button>
            </div>
            <div className="rounded-[1.5rem] border border-dashed border-qatar-200 bg-qatar-50/60 p-4 text-sm text-zinc-700">
              <div className="flex items-center justify-between gap-3"><span>الملفات المرفوعة مؤقتًا</span><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-qatar-800">{uploadedFiles.length}</span></div>
              <div className="mt-3 space-y-2">{uploadedFiles.map((file) => <div key={file.url} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2"><span className="truncate">{file.title}</span><span className="text-xs text-zinc-500">{formatBytes(file.size)}</span></div>)}</div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="panel p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <h3 className="text-2xl font-black text-zinc-950">المنتجات بحسب الصف</h3>
              <div className="mt-5 space-y-4">{groupedProducts.map((group) => <div key={group.grade} className="rounded-[1.5rem] border border-qatar-100 p-4"><div className="flex items-center justify-between gap-4"><h4 className="font-black text-zinc-950">{group.grade}</h4><span className="rounded-full bg-qatar-50 px-3 py-1 text-xs font-bold text-qatar-800">{group.items.length} منتج</span></div><div className="mt-3 space-y-2">{group.items.slice(0, 5).map((product) => <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-3 py-2 text-sm"><div className="min-w-0"><p className="truncate font-semibold text-zinc-900">{product.title}</p><p className="text-xs text-zinc-500">{product.subject} · {product.status}</p></div><div className="flex items-center gap-2"><span className="shrink-0 font-black text-qatar-800">{currencyLabel(product.price)}</span><button type="button" onClick={() => startEditProduct(product)} className="chip py-1.5"><PencilLine size={14} />تعديل</button><button type="button" onClick={() => deleteProduct(product.id)} className="chip py-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"><Trash2 size={14} />حذف</button></div></div>)}</div></div>)}</div>
            </div>
            <div className="panel p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <h3 className="text-xl font-black text-zinc-950">المرفقات</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-600">ارفع ملفات المنتج بصيغ {describeAllowedPrivateUploads()}، وسيتم ربطها بالمنتج فور الحفظ مع فحص النوع والحجم على الخادم.</p>
              <label className="mt-4 block rounded-[1.5rem] border-2 border-dashed border-qatar-200 bg-qatar-50/40 p-6 text-center transition hover:border-qatar-300 hover:bg-qatar-50">
                <UploadCloud className="mx-auto text-qatar-700" size={28} />
                <span className="mt-3 block text-sm font-semibold text-zinc-800">اضغط أو اسحب الملفات هنا</span>
                <input ref={fileInputRef} type="file" multiple accept={PRIVATE_UPLOAD_ACCEPT} onChange={(e) => uploadFiles(e.target.files)} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "grades" ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="panel space-y-5 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4"><div><h3 className="text-2xl font-black text-zinc-950">{editingGradeId ? "تعديل صف" : "إضافة صف جديد"}</h3><p className="mt-1 text-sm text-zinc-500">إدارة الصفوف منفصلة حتى لا تختلط المنتجات بين المراحل.</p></div>{editingGradeId ? <button type="button" onClick={resetGradeForm} className="chip">إلغاء التعديل</button> : null}</div>
            <label className="block space-y-2"><span className="text-sm font-semibold text-zinc-700">اسم الصف</span><input className="input" value={gradeForm.name} onChange={(e) => setGradeForm((c) => ({ ...c, name: e.target.value }))} placeholder="الصف السابع" /></label>
            <label className="block space-y-2"><span className="text-sm font-semibold text-zinc-700">الترتيب</span><input className="input" type="number" value={gradeForm.sortOrder} onChange={(e) => setGradeForm((c) => ({ ...c, sortOrder: Number(e.target.value) }))} /></label>
            <div className="flex gap-3"><button type="button" disabled={busy} onClick={saveGrade} className="btn-primary disabled:opacity-60"><PlusCircle size={16} />{editingGradeId ? "حفظ التعديلات" : "حفظ الصف"}</button><button type="button" onClick={resetGradeForm} className="btn-secondary">إعادة ضبط</button></div>
          </div>
          <div className="space-y-6">
            <div className="panel space-y-5 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-4"><div><h3 className="text-2xl font-black text-zinc-950">{editingSubjectId ? "تعديل مادة" : "إضافة مادة جديدة"}</h3><p className="mt-1 text-sm text-zinc-500">اختر الصف ثم أضف المادة التي تتبعه.</p></div>{editingSubjectId ? <button type="button" onClick={resetSubjectForm} className="chip">إلغاء التعديل</button> : null}</div>
              <label className="block space-y-2"><span className="text-sm font-semibold text-zinc-700">الصف</span><select className="input" value={subjectForm.gradeId} onChange={(e) => setSubjectForm((c) => ({ ...c, gradeId: e.target.value }))}>{catalog.map((item) => <option key={item.id} value={item.id}>{item.grade}</option>)}</select></label>
              <label className="block space-y-2"><span className="text-sm font-semibold text-zinc-700">اسم المادة</span><input className="input" value={subjectForm.name} onChange={(e) => setSubjectForm((c) => ({ ...c, name: e.target.value }))} placeholder="اللغة العربية" /></label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-zinc-700">الشعار المتحرك للمادة</span>
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                  <input className="input" value={subjectForm.motionLogo} onChange={(e) => setSubjectForm((c) => ({ ...c, motionLogo: e.target.value }))} placeholder="/uploads/subject-logo.gif" />
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-qatar-200 bg-white px-4 py-3 text-sm font-semibold text-qatar-800 transition hover:bg-qatar-50">
                    <Sparkles size={16} /> رفع شعار
                    <input type="file" accept={PUBLIC_IMAGE_ACCEPT} className="hidden" onChange={(e) => uploadSubjectMotionLogo(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                {subjectForm.motionLogo ? (
                  <div className="mt-3 inline-flex items-center gap-3 rounded-2xl border border-qatar-100 bg-qatar-50/60 p-3">
                    <img src={subjectForm.motionLogo} alt="معاينة شعار المادة" className="h-14 w-14 rounded-xl object-cover shadow-sm" />
                    <span className="text-xs font-bold leading-6 text-qatar-800">سيظهر هذا الشعار فوق كروت المنتجات الخاصة بهذه المادة.</span>
                  </div>
                ) : null}
              </label>
              <label className="block space-y-2"><span className="text-sm font-semibold text-zinc-700">الترتيب</span><input className="input" type="number" value={subjectForm.sortOrder} onChange={(e) => setSubjectForm((c) => ({ ...c, sortOrder: Number(e.target.value) }))} /></label>
              <div className="flex gap-3"><button type="button" disabled={busy} onClick={saveSubject} className="btn-primary disabled:opacity-60"><PlusCircle size={16} />{editingSubjectId ? "حفظ التعديلات" : "حفظ المادة"}</button><button type="button" onClick={resetSubjectForm} className="btn-secondary">إعادة ضبط</button></div>
            </div>
            <div className="space-y-4">{catalog.map((item) => <div key={item.id} className="rounded-[1.5rem] border border-qatar-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.04)]"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-qatar-700">صف</p><h4 className="mt-1 text-lg font-black text-zinc-950">{item.grade}</h4></div><div className="flex gap-2"><button type="button" onClick={() => startEditGrade(item)} className="chip"><PencilLine size={15} />تعديل</button><button type="button" onClick={() => deleteGrade(item.id)} className="chip border-rose-200 text-rose-700 hover:bg-rose-50"><Trash2 size={15} />حذف</button></div></div><div className="mt-4 flex flex-wrap gap-2">{item.subjects.map((subject) => <div key={subject.id} className="inline-flex items-center gap-2 rounded-full bg-qatar-50 px-3 py-2 text-sm font-semibold text-qatar-800">{subject.motionLogo ? <img src={subject.motionLogo} alt="" className="h-7 w-7 rounded-full border border-white object-cover shadow-sm" /> : null}<span>{subject.name}</span><button type="button" onClick={() => startEditSubject(item.id, subject)} className="rounded-full bg-white p-1 text-qatar-700"><PencilLine size={12} /></button><button type="button" onClick={() => deleteSubject(subject.id)} className="rounded-full bg-white p-1 text-rose-700"><Trash2 size={12} /></button></div>)}</div></div>)}</div>
          </div>
        </div>
      ) : null}

      {tab === "pages" ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="panel space-y-5 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4"><div><h3 className="text-2xl font-black text-zinc-950">{editingPageId ? "تعديل صفحة مادة" : "إنشاء صفحة مادة"}</h3><p className="mt-1 text-sm text-zinc-500">كل صفحة تُربط بالصف والمادة المحددين تلقائيًا.</p></div>{editingPageId ? <button type="button" onClick={resetPageForm} className="chip">إلغاء التعديل</button> : null}</div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">الصف</span><select className="input" value={pageForm.grade} onChange={(e) => setPageForm((c) => ({ ...c, grade: e.target.value, subject: catalog.find((g) => g.grade === e.target.value)?.subjects[0]?.name ?? c.subject }))}>{gradeOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">المادة</span><select className="input" value={pageForm.subject} onChange={(e) => setPageForm((c) => ({ ...c, subject: e.target.value }))}>{subjectsForPage.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>
            <label className="block space-y-2"><span className="text-sm font-semibold text-zinc-700">عنوان الصفحة</span><input className="input" value={pageForm.title} onChange={(e) => setPageForm((c) => ({ ...c, title: e.target.value }))} /></label>
            <label className="block space-y-2"><span className="text-sm font-semibold text-zinc-700">عنوان البطل</span><input className="input" value={pageForm.heroLabel} onChange={(e) => setPageForm((c) => ({ ...c, heroLabel: e.target.value }))} /></label>
            <label className="block space-y-2"><span className="text-sm font-semibold text-zinc-700">التمهيد</span><textarea className="textarea" value={pageForm.intro} onChange={(e) => setPageForm((c) => ({ ...c, intro: e.target.value }))} /></label>
            <label className="block space-y-2"><span className="text-sm font-semibold text-zinc-700">النص التفصيلي</span><textarea className="textarea" value={pageForm.body} onChange={(e) => setPageForm((c) => ({ ...c, body: e.target.value }))} /></label>
            <label className="inline-flex items-center gap-3 text-sm font-semibold text-zinc-700"><input type="checkbox" checked={pageForm.published} onChange={(e) => setPageForm((c) => ({ ...c, published: e.target.checked }))} />منشورة</label>
            <div className="flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={savePage} className="btn-primary disabled:opacity-60"><PlusCircle size={16} />{editingPageId ? "حفظ التعديلات" : "حفظ الصفحة"}</button><button type="button" onClick={resetPageForm} className="btn-secondary">إعادة ضبط</button></div>
          </div>
          <div className="panel p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <h3 className="text-2xl font-black text-zinc-950">الصفحات المنشأة</h3>
            <div className="mt-5 space-y-3">{pages.map((page) => <div key={page.id} className="rounded-[1.5rem] border border-qatar-100 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.03)]"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-qatar-700">{page.grade}</p><h4 className="mt-1 text-lg font-black text-zinc-950">{page.title}</h4><p className="mt-1 text-sm text-zinc-500">{page.subject}</p></div><div className="flex gap-2"><button type="button" onClick={() => startEditPage(page)} className="chip"><PencilLine size={14} />تعديل</button><button type="button" onClick={() => deletePage(page.id)} className="chip border-rose-200 text-rose-700 hover:bg-rose-50"><Trash2 size={14} />حذف</button></div></div><p className="mt-3 line-clamp-2 text-sm leading-7 text-zinc-600">{page.intro}</p></div>)}</div>
          </div>
        </div>
      ) : null}

      {tab === "uploads" ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="panel p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <h3 className="text-2xl font-black text-zinc-950">رفع الملفات</h3>
            <p className="mt-2 text-sm leading-7 text-zinc-600">ارفع ملفات {describeAllowedPrivateUploads()} حتى {formatBytes(MAX_UPLOAD_BYTES)} لكل ملف. يتم حفظ ملفات البيع داخل مساحة خاصة، وتبقى الصور فقط قابلة للعرض كأغلفة.</p>
            <label className="mt-5 block rounded-[1.5rem] border-2 border-dashed border-qatar-200 bg-qatar-50/40 p-8 text-center transition hover:border-qatar-300 hover:bg-qatar-50">
              <UploadCloud className="mx-auto text-qatar-700" size={28} />
              <span className="mt-3 block text-sm font-semibold text-zinc-800">اضغط أو اسحب الملفات هنا</span>
              <input ref={fileInputRef} type="file" multiple accept={PRIVATE_UPLOAD_ACCEPT} onChange={(e) => uploadFiles(e.target.files)} className="hidden" />
            </label>
          </div>
          <div className="panel p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <h3 className="text-2xl font-black text-zinc-950">الملفات الجاهزة</h3>
            <div className="mt-4 space-y-2">{uploadedFiles.map((file) => <div key={file.url} className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3"><div><p className="font-semibold text-zinc-950">{file.title}</p><p className="text-xs text-zinc-500">{file.url}</p></div><span className="text-xs text-zinc-500">{formatBytes(file.size)}</span></div>)}</div>
          </div>
        </div>
      ) : null}

      {tab === "pricing" ? (
        <div className="panel p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="text-2xl font-black text-zinc-950">التسعير السريع</h3><p className="mt-2 text-sm leading-7 text-zinc-600">عدل الأسعار واحفظ المنتجات المميزة ورتب ظهورها دون الدخول في كل منتج على حدة.</p></div><div className="rounded-full bg-qatar-50 px-4 py-2 text-xs font-bold text-qatar-800">إجمالي المنتجات: {products.length}</div></div>
          <div className="mt-5 space-y-4">{products.map((product) => { const draft = priceDrafts[product.id] ?? { price: String(product.price), compareAt: product.compareAt ? String(product.compareAt) : "", featured: product.featured, status: product.status, sortOrder: String(product.sortOrder ?? 0) }; return <div key={product.id} className="grid gap-3 rounded-[1.5rem] border border-qatar-100 p-4 lg:grid-cols-[1fr_120px_120px_120px_120px_auto] lg:items-center"><div><p className="font-bold text-zinc-950">{product.title}</p><p className="text-sm text-zinc-500">{product.grade} · {product.subject}</p></div><input className="input" type="number" value={draft.price} onChange={(e) => setPriceDrafts((c) => ({ ...c, [product.id]: { ...draft, price: e.target.value } }))} /><input className="input" type="number" value={draft.compareAt} onChange={(e) => setPriceDrafts((c) => ({ ...c, [product.id]: { ...draft, compareAt: e.target.value } }))} placeholder="السعر السابق" /><input className="input" value={draft.sortOrder} onChange={(e) => setPriceDrafts((c) => ({ ...c, [product.id]: { ...draft, sortOrder: e.target.value } }))} placeholder="الترتيب" /><button type="button" onClick={() => setPriceDrafts((c) => ({ ...c, [product.id]: { ...draft, featured: !draft.featured } }))} className={`chip justify-center ${draft.featured ? "border-qatar-300 bg-qatar-50 text-qatar-800" : ""}`}>{draft.featured ? "مميز" : "عادي"}</button><button type="button" disabled={busy} onClick={() => savePrice(product.id)} className="btn-primary h-11 justify-center disabled:opacity-60">حفظ</button></div>; })}</div>
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="panel p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <h3 className="text-2xl font-black text-zinc-950">إعدادات الموقع</h3>
            <p className="mt-2 text-sm leading-7 text-zinc-600">هذه الإعدادات تُخزن في قاعدة البيانات وتُستخدم لاحقًا في الهوية العامة والاتصال والدفع.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">اسم الموقع</span><input className="input" value={settingsForm.brandName} onChange={(e) => setSettingsForm((c) => ({ ...c, brandName: e.target.value }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">البريد الداعم</span><input className="input" value={settingsForm.supportEmail} onChange={(e) => setSettingsForm((c) => ({ ...c, supportEmail: e.target.value }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">الهاتف</span><input className="input" value={settingsForm.supportPhone} onChange={(e) => setSettingsForm((c) => ({ ...c, supportPhone: e.target.value }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">واتساب</span><input className="input" value={settingsForm.whatsapp} onChange={(e) => setSettingsForm((c) => ({ ...c, whatsapp: e.target.value }))} /></label>
              <label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold text-zinc-700">سطر التمهيد</span><input className="input" value={settingsForm.heroEyebrow} onChange={(e) => setSettingsForm((c) => ({ ...c, heroEyebrow: e.target.value }))} /></label>
              <label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold text-zinc-700">عنوان البطل</span><input className="input" value={settingsForm.heroTitle} onChange={(e) => setSettingsForm((c) => ({ ...c, heroTitle: e.target.value }))} /></label>
              <label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold text-zinc-700">وصف البطل</span><textarea className="textarea" value={settingsForm.heroDescription} onChange={(e) => setSettingsForm((c) => ({ ...c, heroDescription: e.target.value }))} /></label>
              <label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold text-zinc-700">ملاحظة الدفع</span><input className="input" value={settingsForm.checkoutNote} onChange={(e) => setSettingsForm((c) => ({ ...c, checkoutNote: e.target.value }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">لون أساسي</span><input className="input" value={settingsForm.primaryColor} onChange={(e) => setSettingsForm((c) => ({ ...c, primaryColor: e.target.value }))} /></label>
              <label className="space-y-2"><span className="text-sm font-semibold text-zinc-700">لون ثانوي</span><input className="input" value={settingsForm.secondaryColor} onChange={(e) => setSettingsForm((c) => ({ ...c, secondaryColor: e.target.value }))} /></label>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" disabled={busy} onClick={saveSettings} className="btn-primary disabled:opacity-60">حفظ الإعدادات</button>
              <button type="button" onClick={() => setSettingsForm(settings)} className="btn-secondary">إرجاع القيم الحالية</button>
            </div>
          </div>
          <div className="space-y-6">
            <div className="panel p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <h3 className="text-2xl font-black text-zinc-950">آخر الصفحات</h3>
              <div className="mt-4 space-y-2">{pages.slice(0, 5).map((page) => <div key={page.id} className="rounded-[1.25rem] bg-zinc-50 px-4 py-3 text-sm text-zinc-700">{page.grade} · {page.subject} — {page.title}</div>)}</div>
            </div>
            <div className="panel p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] text-sm leading-7 text-zinc-600">
              <p>• يمكنك ربط هذه القيم لاحقًا بالواجهة العامة بدون تغيير قاعدة البيانات.</p>
              <p>• لن تظهر لوحة الإدارة للمستخدم العادي إلا عبر المسار المباشر وحماية الدخول.</p>
              <p>• الرفع والتسعير والحذف والتعديل أصبحت عمليات حقيقية وليست شكلية.</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminDashboard;
