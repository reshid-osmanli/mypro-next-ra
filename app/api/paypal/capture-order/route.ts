import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { capturePaypalOrder } from "@/lib/payments";
import { DOWNLOAD_SESSION_COOKIE, DOWNLOAD_SESSION_TTL_MS, createSecureToken, hashToken } from "@/lib/order-access";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";

const schema = z.object({
  orderId: z.string().trim().min(1).max(128)
});

type PaypalCapture = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: {
          currency_code?: string;
          value?: string;
        };
      }>;
    };
  }>;
};

function expectedMoneyValue(amount: number) {
  return amount.toFixed(2);
}

function getCompletedCapture(capture: PaypalCapture) {
  const purchaseUnit = capture.purchase_units?.[0];
  const paymentCapture = purchaseUnit?.payments?.captures?.find((item) => String(item.status ?? "").toUpperCase() === "COMPLETED");
  return { purchaseUnit, paymentCapture };
}

function validatePaypalCapture(capture: PaypalCapture, localOrderId: string, total: number) {
  const { purchaseUnit, paymentCapture } = getCompletedCapture(capture);
  const expectedCurrency = (process.env.NEXT_PUBLIC_PAYPAL_CURRENCY ?? "USD").toUpperCase();
  const referenceMatches = purchaseUnit?.reference_id === localOrderId && purchaseUnit?.custom_id === localOrderId;
  const amount = paymentCapture?.amount;
  const capturedValue = Number(amount?.value);
  const amountMatches =
    amount?.currency_code?.toUpperCase() === expectedCurrency &&
    Number.isFinite(capturedValue) &&
    capturedValue.toFixed(2) === expectedMoneyValue(total);

  return {
    ok: Boolean(paymentCapture?.id && referenceMatches && amountMatches),
    captureId: paymentCapture?.id
  };
}

export async function POST(req: Request) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const ip = getRequestIp(req);
  if (isRateLimited(`paypal-capture-order:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة. حاول بعد قليل" }, { status: 429 });
  }

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

  const localOrder = await prisma.order.findFirst({
    where: { providerOrderId: parsed.data.orderId },
    include: { items: true }
  });

  if (!localOrder) {
    return NextResponse.json({ error: "الطلب المحلي غير موجود" }, { status: 404 });
  }

  if (localOrder.status === "paid" && localOrder.providerCaptureId) {
    return NextResponse.json({
      ok: true,
      orderId: localOrder.id,
      alreadyCaptured: true
    });
  }

  if (localOrder.status !== "pending") {
    return NextResponse.json({ error: "لا يمكن إتمام الدفع لهذا الطلب" }, { status: 409 });
  }

  const capture = (await capturePaypalOrder(parsed.data.orderId, `${localOrder.id}:capture`)) as PaypalCapture;
  const captureStatus = String(capture?.status ?? "").toUpperCase();
  const validation = validatePaypalCapture(capture, localOrder.id, localOrder.total);

  if (captureStatus !== "COMPLETED" || !validation.ok || !validation.captureId) {
    return NextResponse.json({ error: "لم يتم التحقق من مبلغ PayPal أو مرجع الطلب" }, { status: 400 });
  }

  const sessionToken = createSecureToken();

  await prisma.order.update({
    where: { id: localOrder.id },
    data: {
      status: "paid",
      providerCaptureId: validation.captureId,
      paymentMethod: "paypal",
      downloadClaimHash: null,
      downloadClaimExpiresAt: null,
      downloadClaimUsedAt: null,
      downloadSessionHash: hashToken(sessionToken),
      downloadSessionExpiresAt: new Date(Date.now() + DOWNLOAD_SESSION_TTL_MS),
      downloadSessionUsedAt: null
    }
  });

  const response = NextResponse.json({
    ok: true,
    orderId: localOrder.id,
    captureId: validation.captureId,
    claimToken: null
  });

  response.cookies.set(DOWNLOAD_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DOWNLOAD_SESSION_TTL_MS / 1000
  });

  return response;
}
