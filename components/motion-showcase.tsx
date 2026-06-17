"use client";

import { BookOpenText, CreditCard, FileCheck2, Layers3, LibraryBig, SearchCheck, ShieldCheck } from "lucide-react";
import { KutubiLogoMotion } from "./kutubi-logo-motion";
import { useSitePreferences, type LocalizedTextValue } from "./site-preferences";

export type MotionShowcaseVariant = "logo" | "store" | "library" | "checkout" | "cart" | "product" | "subject" | "download";

type MotionShowcaseProps = {
  variant: MotionShowcaseVariant;
  compact?: boolean;
  className?: string;
};

const variantMeta: Record<MotionShowcaseVariant, { title: LocalizedTextValue; label: LocalizedTextValue; icon: typeof Layers3 }> = {
  logo: {
    title: { ar: "هوية كُتبي تتحرك بهدوء", en: "Kutubi identity in motion" },
    label: { ar: "شعار متحرك", en: "Animated logo" },
    icon: BookOpenText
  },
  store: {
    title: { ar: "بحث مباشر وفلاتر تتحرك مع النتائج", en: "Live search and filters in motion" },
    label: { ar: "المتجر", en: "Store" },
    icon: SearchCheck
  },
  library: {
    title: { ar: "مسارات الصفوف والمواد تظهر كخريطة تعليمية", en: "Grades and subjects appear as a learning map" },
    label: { ar: "المكتبة", en: "Library" },
    icon: LibraryBig
  },
  checkout: {
    title: { ar: "دفع محمي عبر PayPal وStripe حتى التحميل", en: "Protected PayPal and Stripe payment through download" },
    label: { ar: "الدفع", en: "Checkout" },
    icon: CreditCard
  },
  cart: {
    title: { ar: "كل ملف رقمي يبقى نسخة واحدة واضحة", en: "Each digital file stays as one clear copy" },
    label: { ar: "السلة", en: "Cart" },
    icon: FileCheck2
  },
  product: {
    title: { ar: "أغلفة وملفات المنتج تتحرك مثل حزمة جاهزة", en: "Product covers and files move like a ready pack" },
    label: { ar: "المنتج", en: "Product" },
    icon: Layers3
  },
  subject: {
    title: { ar: "محتوى المادة يظهر كدفتر دروس منظم", en: "Subject content appears as an organized lesson notebook" },
    label: { ar: "صفحة المادة", en: "Subject page" },
    icon: BookOpenText
  },
  download: {
    title: { ar: "روابط التحميل تلمع بعد اكتمال الطلب", en: "Download links glow after the order is complete" },
    label: { ar: "التحميل", en: "Downloads" },
    icon: ShieldCheck
  }
};

const variantTags: Record<MotionShowcaseVariant, LocalizedTextValue[]> = {
  logo: [
    { ar: "كتاب", en: "Book" },
    { ar: "ملف", en: "File" },
    { ar: "كُتبي", en: "Kutubi" }
  ],
  store: [
    { ar: "بحث", en: "Search" },
    { ar: "فلتر", en: "Filter" },
    { ar: "نتائج", en: "Results" }
  ],
  library: [
    { ar: "صف", en: "Grade" },
    { ar: "مادة", en: "Subject" },
    { ar: "مسار", en: "Path" }
  ],
  checkout: [
    { ar: "سلة", en: "Cart" },
    { ar: "PayPal", en: "PayPal" },
    { ar: "Stripe", en: "Stripe" }
  ],
  cart: [
    { ar: "1 نسخة", en: "1 copy" },
    { ar: "رقمي", en: "Digital" },
    { ar: "جاهز", en: "Ready" }
  ],
  product: [
    { ar: "PPTX", en: "PPTX" },
    { ar: "PDF", en: "PDF" },
    { ar: "DOCX", en: "DOCX" }
  ],
  subject: [
    { ar: "درس", en: "Lesson" },
    { ar: "نشاط", en: "Activity" },
    { ar: "ملخص", en: "Summary" }
  ],
  download: [
    { ar: "آمن", en: "Secure" },
    { ar: "رابط", en: "Link" },
    { ar: "تحميل", en: "Download" }
  ]
};

function MotionGraphic({ variant }: { variant: MotionShowcaseVariant }) {
  const { text } = useSitePreferences();

  if (variant === "logo") {
    return <KutubiLogoMotion className="mx-auto" />;
  }

  return (
    <div className={`motion-graphic motion-graphic-${variant}`}>
      <div className="motion-glass-disc" aria-hidden="true" />
      <span className="motion-orbit-dash motion-orbit-dash-a" aria-hidden="true" />
      <span className="motion-orbit-dash motion-orbit-dash-b" aria-hidden="true" />
      <span className="motion-orbit-dash motion-orbit-dash-c" aria-hidden="true" />
      <span className="motion-ring motion-ring-one" />
      <span className="motion-ring motion-ring-two" />
      <span className="motion-pulse-dot motion-dot-one" />
      <span className="motion-pulse-dot motion-dot-two" />
      <span className="motion-pulse-dot motion-dot-three" />

      <div className="motion-card motion-card-main">
        <span className="motion-card-bar motion-card-bar-a" />
        <span className="motion-card-bar motion-card-bar-b" />
        <span className="motion-card-bar motion-card-bar-c" />
        <div className="motion-card-grid">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>

      <div className="motion-card motion-card-side">
        <i />
        <i />
        <i />
      </div>

      <div className="motion-path">
        <span />
        <span />
        <span />
      </div>

      <div className="motion-scan-line" aria-hidden="true" />
      <div className="motion-mini-stack" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="motion-flow-strip" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="motion-folded-page" aria-hidden="true">
        <span />
        <span />
      </div>

      <div className="motion-tags">
        {variantTags[variant].map((tag) => (
          <span key={text(tag)}>{text(tag)}</span>
        ))}
      </div>

      <div className="motion-token motion-token-a" />
      <div className="motion-token motion-token-b" />
    </div>
  );
}

export function MotionShowcase({ variant, compact = false, className = "" }: MotionShowcaseProps) {
  const { text } = useSitePreferences();
  const meta = variantMeta[variant];
  const Icon = meta.icon;

  return (
    <div className={`motion-showcase ${compact ? "motion-showcase-compact" : ""} ${className}`}>
      <div className="motion-showcase-header">
        <span className="motion-showcase-icon">
          <Icon size={16} />
        </span>
        <span>{text(meta.label)}</span>
      </div>
      <MotionGraphic variant={variant} />
      {!compact ? <p className="motion-showcase-title">{text(meta.title)}</p> : null}
    </div>
  );
}
