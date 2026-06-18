// ============================================================================
// lib/upsell-suggestions.ts — Suggest related products based on cart contents
// ----------------------------------------------------------------------------
// New file: /lib/upsell-suggestions.ts
// ============================================================================

import { prisma } from "@/lib/db";

export type CartItemLite = {
  id: string;
  subject?: string;
  category?: string;
  grade?: string;
};

export type UpsellSuggestion = {
  productId: string;
  title: string;
  slug: string;
  price: number;
  discountPercent: number;
  reason: string; // "مرتبط بـ الرياضيات"
  coverImage: string | null;
};

export async function getUpsellSuggestions(
  cartItems: CartItemLite[],
  limit = 3
): Promise<UpsellSuggestion[]> {
  if (!cartItems.length) return [];

  try {
    const rules = await prisma.upsellRule.findMany({
      where: { active: true },
      orderBy: { priority: "desc" },
      take: 50,
    });

    const cartProductIds = new Set(cartItems.map((c) => c.id));
    const cartSubjects = new Set(cartItems.map((c) => c.subject).filter(Boolean));
    const cartCategories = new Set(cartItems.map((c) => c.category).filter(Boolean));

    const matched = rules
      .filter((rule) => {
        if (rule.triggerProductId && cartProductIds.has(rule.triggerProductId)) return true;
        if (rule.triggerSubject && cartSubjects.has(rule.triggerSubject)) return true;
        if (rule.triggerCategory && cartCategories.has(rule.triggerCategory)) return true;
        return false;
      })
      .filter((rule) => !cartProductIds.has(rule.suggestProductId))
      .slice(0, limit);

    if (!matched.length) return [];

    const suggestedIds = matched.map((r) => r.suggestProductId);
    const products = await prisma.product.findMany({
      where: { id: { in: suggestedIds }, status: "published" },
      select: { id: true, slug: true, title: true, price: true, coverImage: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    return matched
      .map((rule) => {
        const product = productMap.get(rule.suggestProductId);
        if (!product) return null;
        const discountedPrice = Math.round(
          product.price * (1 - rule.discountPercent / 100)
        );
        return {
          productId: product.id,
          title: product.title,
          slug: product.slug,
          price: discountedPrice,
          discountPercent: rule.discountPercent,
          reason: rule.title,
          coverImage: product.coverImage,
        };
      })
      .filter((s): s is UpsellSuggestion => s !== null);
  } catch (error) {
    console.warn("[upsell] Database unavailable", error);
    return [];
  }
}
