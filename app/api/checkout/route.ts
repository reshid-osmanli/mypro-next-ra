import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createStripeSession } from "@/lib/payments";
import type { CheckoutPayload } from "@/lib/types";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { validateCheckoutReadiness } from "@/lib/checkout-readiness";
import { resolveSiteUrl } from "@/lib/site-url";
import { checkoutItemsSchema } from "@/lib/security-validation";
import { reportApiFailure, reportCaughtError, routeContext } from "@/lib/report-caught-error";

const schema = z.object({
  items: checkoutItemsSchema,
  customerName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(1000).optional(),
  purchaseTrackingConsent: z.boolean().optional().default(false),
  paymentMethod: z.literal("stripe")
});

export async function POST(req: Request) {
  const ip = getRequestIp(req);
  const rateKey = `checkout:${ip}`;
  if (isRateLimited(rateKey, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة. حاول بعد قليل" }, { status: 429 });
  }
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "تعذر قراءة بيانات الطلب" }, { status: 400 });
  }

  const parsed = schema.safeParse(body as CheckoutPayload);

  if (!parsed.success) {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });
  }

  const session = await auth();
  const sessionEmail = session?.user?.email?.trim().toLowerCase();
  const submittedEmail = parsed.data.email.trim().toLowerCase();
  const orderEmail = sessionEmail || submittedEmail;
  const purchaseTrackingConsent = Boolean(sessionEmail || parsed.data.purchaseTrackingConsent);

  if (sessionEmail && sessionEmail !== submittedEmail) {
    console.warn("[checkout] Ignoring submitted email because an authenticated Google email is present", {
      sessionEmail,
      submittedEmail
    });
  }

  const productIds = [...new Set(parsed.data.items.map((item) => item.id))];
  const readiness = await validateCheckoutReadiness(productIds);
  if (!readiness.ok) {
    return NextResponse.json({ error: readiness.error }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "published" },
    select: { id: true, title: true, price: true }
  });

  const productMap = new Map(products.map((product) => [product.id, product]));
  const normalizedItems = parsed.data.items.map((item) => {
    const product = productMap.get(item.id);
    if (!product) throw new Error("المنتج غير موجود");
    return {
      productId: product.id,
      productTitle: product.title,
      price: product.price,
      quantity: item.quantity
    };
  });

  const total = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const effectiveSiteUrl = resolveSiteUrl();
  if (!effectiveSiteUrl) {
    await reportApiFailure(req, "AUTH_URL أو NEXT_PUBLIC_SITE_URL مطلوب على Vercel", { statusCode: 500, area: "payments" });
    return NextResponse.json({ error: "AUTH_URL أو NEXT_PUBLIC_SITE_URL مطلوب على Vercel" }, { status: 500 });
  }

  const order = await prisma.order.create({
    data: {
      customerName: parsed.data.customerName,
      email: orderEmail,
      phone: parsed.data.phone,
      notes: parsed.data.notes,
      purchaseTrackingConsent,
      total,
      paymentMethod: parsed.data.paymentMethod,
      items: {
        create: normalizedItems
      }
    }
  });

  const successUrl = `${effectiveSiteUrl}/api/stripe/complete?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${effectiveSiteUrl}/checkout?order=${order.id}`;

  try {
    const session = await createStripeSession({
      orderReference: order.id,
      items: normalizedItems.map((item) => ({ title: item.productTitle, price: item.price, quantity: item.quantity })),
      successUrl,
      cancelUrl,
      customerEmail: orderEmail
    });
    await prisma.order.update({ where: { id: order.id }, data: { providerOrderId: session.id } });
    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (error) {
    await reportCaughtError(error, { ...routeContext(req, "payments"), statusCode: 500 });
    await prisma.order.update({ where: { id: order.id }, data: { status: "failed" } }).catch(() => null);
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر إنشاء جلسة Stripe" }, { status: 500 });
  }
}
