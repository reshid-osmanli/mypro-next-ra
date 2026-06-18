import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getProductReviews, summarizeRatings } from "@/lib/reviews";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(4).max(1000)
});

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const reviews = await getProductReviews(id);
  return NextResponse.json({ reviews, summary: summarizeRatings(reviews) });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const ip = getRequestIp(req);
  if (isRateLimited(`review:${ip}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة. حاول بعد قليل" }, { status: 429 });
  }

  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "يجب تسجيل الدخول لوضع تقييم" }, { status: 401 });
  }

  const { id: productId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "التقييم أو التعليق غير صالح" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, title: true } });
  if (!product) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });

  const paidOrder = await prisma.order.findFirst({
    where: {
      email,
      status: "paid",
      items: { some: { productId } }
    },
    orderBy: { createdAt: "desc" },
    select: { id: true }
  });

  if (!paidOrder) {
    return NextResponse.json({ error: "التقييم متاح فقط لمن اشترى هذا المنتج" }, { status: 403 });
  }

  const review = await prisma.productReview.upsert({
    where: { productId_email: { productId, email } },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      customerName: session?.user?.name ?? null,
      orderId: paidOrder.id,
      approved: true
    },
    create: {
      productId,
      email,
      orderId: paidOrder.id,
      customerName: session?.user?.name ?? null,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      approved: true
    },
    select: { id: true, rating: true, comment: true, customerName: true, createdAt: true }
  });

  const reviews = await getProductReviews(productId);
  return NextResponse.json({
    review: { ...review, createdAt: review.createdAt.toISOString() },
    reviews,
    summary: summarizeRatings(reviews)
  });
}
