// ============================================================================
// lib/bundle-system.ts — Bundle product operations
// ----------------------------------------------------------------------------
// New file: /lib/bundle-system.ts
// ============================================================================

import { prisma } from "@/lib/db";

export type BundleCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  compareAt: number | null;
  discountPercent: number;
  coverImage: string | null;
  badge: string | null;
  items: Array<{
    id: string;
    title: string;
    grade: string;
    subject: string;
    format: string;
    coverImage: string | null;
  }>;
};

export async function getActiveBundles(): Promise<BundleCard[]> {
  try {
    const bundles = await prisma.bundle.findMany({
      where: { active: true },
      include: {
        items: {
          orderBy: { position: "asc" },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                grade: true,
                subject: true,
                format: true,
                coverImage: true,
              },
            },
          },
        },
      },
      orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
    });

    return bundles.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      description: b.description,
      price: b.price,
      compareAt: b.compareAt,
      discountPercent: b.discountPercent,
      coverImage: b.coverImage,
      badge: b.badge,
      items: b.items.map((i) => ({
        id: i.product.id,
        title: i.product.title,
        grade: i.product.grade,
        subject: i.product.subject,
        format: i.product.format,
        coverImage: i.product.coverImage,
      })),
    }));
  } catch (error) {
    console.warn("[bundles] Database unavailable", error);
    return [];
  }
}

export async function getBundleBySlug(slug: string): Promise<BundleCard | null> {
  try {
    const bundle = await prisma.bundle.findUnique({
      where: { slug, active: true },
      include: {
        items: {
          orderBy: { position: "asc" },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                grade: true,
                subject: true,
                format: true,
                coverImage: true,
                price: true,
              },
            },
          },
        },
      },
    });
    if (!bundle) return null;

    return {
      id: bundle.id,
      slug: bundle.slug,
      title: bundle.title,
      description: bundle.description,
      price: bundle.price,
      compareAt: bundle.compareAt,
      discountPercent: bundle.discountPercent,
      coverImage: bundle.coverImage,
      badge: bundle.badge,
      items: bundle.items.map((i) => ({
        id: i.product.id,
        title: i.product.title,
        grade: i.product.grade,
        subject: i.product.subject,
        format: i.product.format,
        coverImage: i.product.coverImage,
      })),
    };
  } catch (error) {
    console.warn("[bundles] Database unavailable", error);
    return null;
  }
}

/** Validate bundle contents: every product must be published + have at least 1 file */
export async function isBundleReady(bundleId: string): Promise<{ ok: boolean; error?: string }> {
  const items = await prisma.bundleItem.findMany({
    where: { bundleId },
    include: { product: { include: { files: true } } },
  });
  if (items.length < 2) return { ok: false, error: "Bundle must contain at least 2 products" };

  for (const item of items) {
    if (item.product.status !== "published") {
      return { ok: false, error: `${item.product.title} is not published` };
    }
    if (item.product.files.length === 0) {
      return { ok: false, error: `${item.product.title} has no files` };
    }
  }
  return { ok: true };
}
