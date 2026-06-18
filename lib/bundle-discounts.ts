export const BUNDLE_DISCOUNT_RATE = 0.2;
export const BUNDLE_MIN_ITEMS = 3;

export type BundleDiscountItem = {
  price: number;
  quantity?: number;
  grade?: string | null;
  subject?: string | null;
  title?: string | null;
};

export type BundleDiscount = {
  key: string;
  grade: string;
  subject: string;
  itemCount: number;
  subtotal: number;
  discount: number;
};

export type BundleDiscountSummary = {
  discount: number;
  bundles: BundleDiscount[];
};

function normalizeLabel(value?: string | null) {
  return value?.trim() || "غير مصنف";
}

export function calculateBundleDiscount(items: BundleDiscountItem[]): BundleDiscountSummary {
  const grouped = new Map<string, { grade: string; subject: string; itemCount: number; subtotal: number }>();

  for (const item of items) {
    const quantity = Math.max(1, Number(item.quantity ?? 1) || 1);
    const grade = normalizeLabel(item.grade);
    const subject = normalizeLabel(item.subject);
    const key = `${grade}\u0000${subject}`;
    const current = grouped.get(key) ?? { grade, subject, itemCount: 0, subtotal: 0 };
    current.itemCount += quantity;
    current.subtotal += Math.max(0, Number(item.price) || 0) * quantity;
    grouped.set(key, current);
  }

  const bundles = Array.from(grouped.entries())
    .filter(([, group]) => group.itemCount >= BUNDLE_MIN_ITEMS && group.subtotal > 0)
    .map(([key, group]) => ({
      key,
      grade: group.grade,
      subject: group.subject,
      itemCount: group.itemCount,
      subtotal: group.subtotal,
      discount: Math.max(1, Math.round(group.subtotal * BUNDLE_DISCOUNT_RATE))
    }));

  return {
    bundles,
    discount: bundles.reduce((sum, bundle) => sum + bundle.discount, 0)
  };
}

export function bundleDiscountLabel() {
  return `خصم حقيبة الفصل ${Math.round(BUNDLE_DISCOUNT_RATE * 100)}%`;
}
