// ============================================================================
// components/empty-states/index.tsx — All empty states
// ----------------------------------------------------------------------------
// New file: /components/empty-states/index.tsx
// ============================================================================

import Link from "next/link";
import { BookOpenText, Inbox, SearchX, ShoppingCart, Star, Users } from "lucide-react";
import type { ReactNode } from "react";

function Shell({
  icon,
  title,
  description,
  cta,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  cta?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-pearl-300 bg-pearl-50/60 px-6 py-14 text-center">
      <div className="rounded-full bg-white p-4 shadow-sm text-qatar-700">{icon}</div>
      <h3 className="text-xl font-black text-zinc-950">{title}</h3>
      {description ? <p className="max-w-md text-sm leading-7 text-zinc-600">{description}</p> : null}
      {children}
      {cta ? (
        <Link
          href={cta.href}
          className="btn-primary mt-3 inline-flex"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}

export function EmptyProducts({
  ctaHref = "/products",
  ctaLabel = "عرض كل المنتجات",
}: {
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <Shell
      icon={<BookOpenText size={28} />}
      title="ما لقينا منتجات تطابق بحثك"
      description="جرّب تغيير الصف أو المادة، أو تصفح كل المنتجات المتاحة في المتجر."
      cta={{ href: ctaHref, label: ctaLabel }}
    />
  );
}

export function EmptyCart() {
  return (
    <Shell
      icon={<ShoppingCart size={28} />}
      title="سلتك فارغة حالياً"
      description="تصفّح المنتجات وأضِف ما تحتاجه إلى السلة لإتمام الشراء لاحقاً."
      cta={{ href: "/products", label: "تصفّح المنتجات" }}
    />
  );
}

export function EmptyReviews() {
  return (
    <Shell
      icon={<Star size={28} />}
      title="لا توجد تقييمات بعد"
      description="كن أول من يضع تقييمًا بعد الشراء وساعد المعلمين الآخرين على اختيار الملف المناسب."
    />
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <Shell
      icon={<SearchX size={28} />}
      title={`لا توجد نتائج لـ "${query}"`}
      description="جرّب كلمات مختلفة أو تصفّح حسب الصف والمادة."
      cta={{ href: "/products", label: "عرض كل المنتجات" }}
    />
  );
}

export function EmptyOrders() {
  return (
    <Shell
      icon={<Inbox size={28} />}
      title="لا توجد طلبات بعد"
      description="ستظهر طلباتك هنا بعد إتمام أول عملية شراء."
      cta={{ href: "/products", label: "ابدأ التسوّق" }}
    />
  );
}

export function EmptyAffiliates() {
  return (
    <Shell
      icon={<Users size={28} />}
      title="لا توجد إحالات حتى الآن"
      description="شارك رابط الإحالة الخاص بك مع المعلمين وابدأ في كسب العمولات."
    />
  );
}

export function GenericEmpty({ title, description, cta }: { title: string; description?: string; cta?: { href: string; label: string } }) {
  return (
    <Shell
      icon={<Inbox size={28} />}
      title={title}
      description={description}
      cta={cta}
    />
  );
}
