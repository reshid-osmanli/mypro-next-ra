import { prisma } from "./db";

export type PublicProductReview = {
  id: string;
  rating: number;
  comment: string;
  customerName: string | null;
  createdAt: string;
};

export type ReviewSummary = {
  averageRating: number;
  reviewCount: number;
};

export function summarizeRatings(reviews: Array<{ rating: number }>): ReviewSummary {
  const reviewCount = reviews.length;
  if (!reviewCount) return { averageRating: 0, reviewCount: 0 };
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount;
  return { averageRating: Number(averageRating.toFixed(1)), reviewCount };
}

export async function getProductReviews(productId: string): Promise<PublicProductReview[]> {
  try {
    const reviews = await prisma.productReview.findMany({
      where: { productId, approved: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, rating: true, comment: true, customerName: true, createdAt: true }
    });

    return reviews.map((review) => ({
      ...review,
      createdAt: review.createdAt.toISOString()
    }));
  } catch (error) {
    console.warn("[reviews] Unable to load product reviews", error);
    return [];
  }
}

export async function getProductReviewSummary(productId: string): Promise<ReviewSummary> {
  try {
    const rows = await prisma.productReview.findMany({
      where: { productId, approved: true },
      select: { rating: true }
    });
    return summarizeRatings(rows);
  } catch (error) {
    console.warn("[reviews] Unable to summarize product reviews", error);
    return { averageRating: 0, reviewCount: 0 };
  }
}

export async function userCanReviewProduct(productId: string, email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return false;

  try {
    const order = await prisma.order.findFirst({
      where: {
        email: normalizedEmail,
        status: "paid",
        items: { some: { productId } }
      },
      select: { id: true }
    });
    return Boolean(order);
  } catch (error) {
    console.warn("[reviews] Unable to verify purchase", error);
    return false;
  }
}
