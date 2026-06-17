// ============================================================================
// tests/bundle-discounts.test.ts — Bundle discount calculation
// ----------------------------------------------------------------------------
// New file: /tests/bundle-discounts.test.ts
// ============================================================================

import { describe, it, expect } from "vitest";
import { calculateBundleDiscount, BUNDLE_DISCOUNT_RATE, BUNDLE_MIN_ITEMS } from "@/lib/bundle-discounts";

describe("bundle discounts", () => {
  it("applies no discount when there are fewer than minimum items", () => {
    const items = [
      { price: 100, quantity: 1, grade: "الصف الأول", subject: "الرياضيات" },
      { price: 100, quantity: 1, grade: "الصف الأول", subject: "الرياضيات" },
    ];
    const result = calculateBundleDiscount(items);
    expect(result.bundles).toHaveLength(0);
    expect(result.discount).toBe(0);
  });

  it("applies discount to grouped items by grade+subject", () => {
    const items = [
      { price: 100, quantity: 1, grade: "الصف الأول", subject: "الرياضيات" },
      { price: 100, quantity: 1, grade: "الصف الأول", subject: "الرياضيات" },
      { price: 100, quantity: 1, grade: "الصف الأول", subject: "الرياضيات" },
    ];
    const result = calculateBundleDiscount(items);
    expect(result.bundles).toHaveLength(1);
    expect(result.bundles[0]?.itemCount).toBe(3);
    expect(result.bundles[0]?.subtotal).toBe(300);
    expect(result.discount).toBe(Math.round(300 * BUNDLE_DISCOUNT_RATE));
  });

  it("keeps bundles separate when grade or subject differ", () => {
    const items = [
      { price: 100, quantity: 2, grade: "الصف الأول", subject: "الرياضيات" },
      { price: 100, quantity: 2, grade: "الصف الثاني", subject: "الرياضيات" },
    ];
    const result = calculateBundleDiscount(items);
    expect(result.bundles).toHaveLength(2);
    expect(result.discount).toBeGreaterThan(0);
  });

  it("ignores empty subjects/grades", () => {
    const items = [
      { price: 100, quantity: BUNDLE_MIN_ITEMS, grade: "", subject: "" },
      { price: 100, quantity: 1, grade: "", subject: "" },
    ];
    const result = calculateBundleDiscount(items);
    expect(result.bundles).toHaveLength(1);
  });
});
