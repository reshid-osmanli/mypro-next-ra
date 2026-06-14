import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { capturePaypalOrder, retrievePaypalOrder } from "@/lib/payments";
import {
  CLAIM_TOKEN_TTL_MS,
  DOWNLOAD_SESSION_COOKIE,
  DOWNLOAD_SESSION_TTL_MS,
  createSecureToken,
  hashToken
} from "@/lib/order-access";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { reportCaughtError, routeContext } from "@/lib/report-caught-error";
import { applyVoucher, captureWalletReservation } from "@/lib/wallet";

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
        custom_id?: string;
      }>;
    };
  }>;
};

function expectedMoneyValue(amount: number) {
  return Number(amount).toFixed(2);
}

function amountsMatch(expected: number, captured?: string) {
  const capturedValue = Number(captured);
  if (!Number.isFinite(capturedValue)) return false;
  return capturedValue.toFixed(2) === expectedMoneyValue(expected);
}

function getCompletedCapture(capture: PaypalCapture) {
  const purchaseUnit = capture.purchase_units?.[0];
  const paymentCapture = purchaseUnit?.payments?.captures?.find((item) => String(item.status ?? "").toUpperCase() === "COMPLETED");
  return { purchaseUnit, paymentCapture };
}

function validatePaypalCapture(capture: PaypalCapture, localOrderId: string, total: number) {
  const { purchaseUnit, paymentCapture } = getCompletedCapture(capture);
  const expectedCurrency = (process.env.NEXT_PUBLIC_PAYPAL_CURRENCY ?? "USD").toUpperCase();
  const referenceMatches = !purchaseUnit?.reference_id || purchaseUnit.reference_id === localOrderId;
  const customId = purchaseUnit?.custom_id ?? paymentCapture?.custom_id;
  const customMatches = !customId || customId === localOrderId;
  const amount = paymentCapture?.amount;
  const amountMatches =
    amount?.currency_code?.toUpperCase() === expectedCurrency && amountsMatch(total, amount?.value);

  return {
    ok: Boolean(paymentCapture?.id && referenceMatches && customMatches && amountMatches),
    captureId: paymentCapture?.id
  };
}

async function getPaypalCaptureResult(paypalOrderId: string, localOrderId: string) {
  try {
    return (await capturePaypalOrder(paypalOrderId, `${localOrderId}:capture`)) as PaypalCapture;
  } catch (error) {
    console.warn("[paypal/capture-order] Capture failed; checking whether PayPal already completed the order.", {
      paypalOrderId,
      localOrderId,
      error: error instanceof Error ? error.message : String(error)
    });
    return (await retrievePaypalOrder(paypalOrderId)) as PaypalCapture;
  }
}

async function issuePaidDownloadSession(localOrderId: string, captureId?: string | null) {
  const sessionToken = createSecureToken();
  const claimToken = createSecureToken();
  const claimExpiresAt = new Date(Date.now() + CLAIM_TOKEN_TTL_MS);

  const order = await prisma.order.update({
    where: { id: localOrderId },
    data: {
      status: "paid",
      ...(captureId ? { providerCaptureId: captureId } : {}),
      paymentMethod: "paypal",
      downloadClaimHash: hashToken(claimToken),
      downloadClaimExpiresAt: claimExpiresAt,
      downloadClaimUsedAt: null,
      downloadSessionHash: hashToken(sessionToken),
      downloadSessionExpiresAt: new Date(Date.now() + DOWNLOAD_SESSION_TTL_MS),
      downloadSessionUsedAt: null
    },
    select: { id: true, email: true, voucherId: true, walletUsed: true, providerCaptureId: true }
  });

  if (order.voucherId) {
    await applyVoucher(order.voucherId, order.email, order.id).catch(() => null);
  }
  if (order.walletUsed > 0) {
    await captureWalletReservation(order.id, `خصم محفظة على الطلب #${order.id.slice(-8)}`).catch(() => null);
  }

  const response = NextResponse.json({
    ok: true,
    orderId: order.id,
    captureId: captureId ?? order.providerCaptureId,
    claimToken
  });

  response.cookies.set(DOWNLOAD_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DOWNLOAD_SESSION_TTL_MS / 1000
  });

  return response;
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
    return issuePaidDownloadSession(localOrder.id, localOrder.providerCaptureId);
  }

  if (localOrder.status !== "pending") {
    return NextResponse.json({ error: "لا يمكن إتمام الدفع لهذا الطلب" }, { status: 409 });
  }

  let capture: PaypalCapture;
  try {
    capture = await getPaypalCaptureResult(parsed.data.orderId, localOrder.id);
  } catch (error) {
    console.error("[paypal/capture-order] Unable to verify PayPal capture.", {
      paypalOrderId: parsed.data.orderId,
      localOrderId: localOrder.id,
      error: error instanceof Error ? error.message : String(error)
    });
    await reportCaughtError(error, { ...routeContext(req, "payments"), statusCode: 502 });
    return NextResponse.json({ error: "Unable to verify PayPal payment." }, { status: 502 });
  }

  const captureStatus = String(capture?.status ?? "").toUpperCase();
  const validation = validatePaypalCapture(capture, localOrder.id, localOrder.total);

  if (captureStatus !== "COMPLETED" || !validation.ok || !validation.captureId) {
    console.error("[paypal/capture-order] PayPal capture validation failed.", {
      paypalOrderId: parsed.data.orderId,
      localOrderId: localOrder.id,
      captureStatus,
      validation,
      referenceId: capture.purchase_units?.[0]?.reference_id,
      customId: capture.purchase_units?.[0]?.custom_id ?? capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id,
      expectedTotal: expectedMoneyValue(localOrder.total),
      capturedAmount: capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount
    });
    return NextResponse.json({ error: "لم يتم التحقق من مبلغ PayPal أو مرجع الطلب" }, { status: 400 });
  }

  return issuePaidDownloadSession(localOrder.id, validation.captureId);
}
