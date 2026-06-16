import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createPaypalOrder } from "@/lib/payments";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { validateCheckoutReadiness } from "@/lib/checkout-readiness";
import { checkoutItemsSchema } from "@/lib/security-validation";
import { reportCaughtError, routeContext } from "@/lib/report-caught-error";
import { getOrCreateWallet, reserveWalletBalance, releaseWalletReservation, validateVoucher } from "@/lib/wallet";

const schema = z.object({
  items: checkoutItemsSchema,
  customerName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(1000).optional(),
  purchaseTrackingConsent: z.boolean().optional().default(false),
  voucherCode: z.string().trim().optional(),
  walletAmountToUse: z.number().min(0).optional()
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

  const session = await auth();
  const sessionEmail = session?.user?.email?.trim().toLowerCase();
  const submittedEmail = parsed.data.email.trim().toLowerCase();
  const orderEmail = sessionEmail || submittedEmail;
  const purchaseTrackingConsent = Boolean(sessionEmail || parsed.data.purchaseTrackingConsent);

  if (sessionEmail && sessionEmail !== submittedEmail) {
    console.warn("[paypal/create-order] Ignoring submitted email because an authenticated Google email is present", {
      sessionEmail,
      submittedEmail
    });
  }

  const productIds = [...new Set(parsed.data.items.map((item) => item.id))];
  const readiness = await validateCheckoutReadiness(productIds);
  if (!readiness.ok) {
    return NextResponse.json({ error: readiness.error }, { status: 400 });
  }

  const products = (await prisma.product.findMany({
    where: { id: { in: productIds }, status: "published" },
    select: { id: true, title: true, price: true }
  })) as Array<{ id: string; title: string; price: number }>;

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
  let voucherDiscount = 0;
  let voucherCode: string | null = null;

  if (parsed.data.voucherCode) {
    const voucherResult = await validateVoucher(parsed.data.voucherCode, orderEmail);
    if (!voucherResult.valid) {
      return NextResponse.json({ error: voucherResult.error || "القسيمة غير صالحة" }, { status: 400 });
    }
    if (voucherResult.voucher) {
      voucherDiscount = Math.min(total, voucherResult.voucher.amount);
      voucherCode = voucherResult.voucher.code;
    }
  }

  const wallet = await getOrCreateWallet(orderEmail);
  const requestedWalletUse = parsed.data.walletAmountToUse || 0;
  const walletDiscount = Math.min(requestedWalletUse, wallet.balance, Math.max(0, total - voucherDiscount));
  const finalDiscount = Math.min(total, voucherDiscount + walletDiscount);
  const finalTotal = Math.max(0, total - finalDiscount);

  if (finalTotal <= 0) {
    return NextResponse.json({ error: "استخدم Stripe لإتمام الطلبات المغطاة بالكامل بالقسائم أو المحفظة." }, { status: 400 });
  }

  const localOrder = await prisma.order.create({
    data: {
      customerName: parsed.data.customerName,
      email: orderEmail,
      phone: parsed.data.phone,
      notes: parsed.data.notes,
      purchaseTrackingConsent,
      total: finalTotal,
      status: "pending",
      paymentMethod: "paypal",
      voucherId: voucherCode,
      walletUsed: walletDiscount,
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
    if (walletDiscount > 0) {
      await reserveWalletBalance(orderEmail, walletDiscount, localOrder.id);
    }

    const paypalOrder = await createPaypalOrder({
      orderReference: localOrder.id,
      amount: finalTotal,
      discountAmount: finalDiscount,
      items: normalizedItems,
      customer: {
        name: parsed.data.customerName,
        email: orderEmail,
        phone: parsed.data.phone,
        notes: parsed.data.notes
      }
    });

    await prisma.order.update({ where: { id: localOrder.id }, data: { providerOrderId: paypalOrder.id } });
    return NextResponse.json({ orderId: paypalOrder.id, localOrderId: localOrder.id });
  } catch (error) {
    await reportCaughtError(error, { ...routeContext(req, "payments"), statusCode: 500 });
    await releaseWalletReservation(localOrder.id).catch(() => null);
    await prisma.order.update({ where: { id: localOrder.id }, data: { status: "failed" } }).catch(() => null);
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر إنشاء الطلب" }, { status: 500 });
  }
}
