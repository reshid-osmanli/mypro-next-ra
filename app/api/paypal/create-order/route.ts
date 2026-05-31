import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createPaypalOrder } from "@/lib/payments";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { checkoutItemsSchema } from "@/lib/security-validation";

const schema = z.object({
  items: checkoutItemsSchema,
  customerName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(1000).optional(),
  purchaseTrackingConsent: z.boolean().optional().default(false)
});

export async function POST(req: Request) {
  const ip = getRequestIp(req);
  const rateKey = `paypal-create-order:${ip}`;
  if (isRateLimited(rateKey, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة. حاول بعد قليل" }, { status: 429 });
  }
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "تعذر قراءة بيانات الطلب" }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });
  }

  const productIds = [...new Set(parsed.data.items.map((item) => item.id))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "published" },
    select: { id: true, title: true, price: true }
  });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "بعض المنتجات غير متاحة أو لم تعد منشورة" }, { status: 400 });
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const normalizedItems = parsed.data.items.map((item) => {
    const product = productMap.get(item.id);
    if (!product) throw new Error("المنتج غير موجود");
    return {
      title: product.title,
      price: product.price,
      quantity: item.quantity
    };
  });

  const total = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const localOrder = await prisma.order.create({
    data: {
      customerName: parsed.data.customerName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      notes: parsed.data.notes,
      purchaseTrackingConsent: parsed.data.purchaseTrackingConsent,
      total,
      status: "pending",
      paymentMethod: "paypal",
      items: {
        create: parsed.data.items.map((item) => ({
          productId: item.id,
          productTitle: productMap.get(item.id)!.title,
          price: productMap.get(item.id)!.price,
          quantity: item.quantity
        }))
      }
    }
  });

  try {
    const paypalOrder = await createPaypalOrder({
      orderReference: localOrder.id,
      amount: total,
      items: normalizedItems,
      customer: {
        name: parsed.data.customerName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        notes: parsed.data.notes
      }
    });

    await prisma.order.update({ where: { id: localOrder.id }, data: { providerOrderId: paypalOrder.id } });
    return NextResponse.json({ orderId: paypalOrder.id, localOrderId: localOrder.id });
  } catch (error) {
    await prisma.order.update({ where: { id: localOrder.id }, data: { status: "failed" } }).catch(() => null);
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر إنشاء الطلب" }, { status: 500 });
  }
}
