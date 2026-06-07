import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { DOWNLOAD_SESSION_COOKIE, DOWNLOAD_SESSION_TTL_MS, createSecureToken, hashToken } from "@/lib/order-access";
import { expectedStripeCurrency, retrieveStripeCheckoutSession } from "@/lib/payments";
import { applyVoucher } from "@/lib/wallet";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  session_id: z.string().trim().min(8).max(255).regex(/^cs_[a-zA-Z0-9_]+$/)
});

function redirect(req: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, req.url), 303);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  return response;
}

function getPaymentIntentId(paymentIntent: unknown) {
  if (typeof paymentIntent === "string") return paymentIntent;
  if (paymentIntent && typeof paymentIntent === "object" && "id" in paymentIntent) {
    const id = (paymentIntent as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const ip = getRequestIp(req);
  if (isRateLimited(`stripe-complete:${ip}`, 10, 15 * 60 * 1000)) {
    return redirect(req, "/checkout?stripe=rate-limited");
  }

  const parsed = schema.safeParse({
    session_id: req.nextUrl.searchParams.get("session_id")
  });

  if (!parsed.success) {
    return redirect(req, "/checkout?stripe=invalid-session");
  }

  try {
    const session = await retrieveStripeCheckoutSession(parsed.data.session_id);
    const orderId = session.metadata?.orderId ?? session.client_reference_id;
    if (!orderId || session.id !== parsed.data.session_id) {
      return redirect(req, "/checkout?stripe=invalid-session");
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentMethod !== "stripe" || order.providerOrderId !== session.id) {
      return redirect(req, "/checkout?stripe=order-not-found");
    }

    if (order.status === "paid") {
      return redirect(req, `/thank-you?order=${encodeURIComponent(order.id)}`);
    }

    const amountMatches =
      session.payment_status === "paid" &&
      session.amount_total === order.total * 100 &&
      session.currency?.toUpperCase() === expectedStripeCurrency();

    if (order.status !== "pending" || !amountMatches) {
      return redirect(req, "/checkout?stripe=payment-not-verified");
    }

    const sessionToken = createSecureToken();
    const paymentIntentId = getPaymentIntentId(session.payment_intent);

    const updated = await prisma.order.updateMany({
      where: { id: order.id, status: "pending", providerOrderId: session.id },
      data: {
        status: "paid",
        providerCaptureId: paymentIntentId,
        downloadClaimHash: null,
        downloadClaimExpiresAt: null,
        downloadClaimUsedAt: null,
        downloadSessionHash: hashToken(sessionToken),
        downloadSessionExpiresAt: new Date(Date.now() + DOWNLOAD_SESSION_TTL_MS),
        downloadSessionUsedAt: null
      }
    });

    if (updated.count !== 1) {
      return redirect(req, "/checkout?stripe=payment-not-verified");
    }

    if (order.voucherId) {
      const voucherCode = order.voucherId;
      await applyVoucher(voucherCode, order.email, order.id).catch(() => null);
    }

    const response = redirect(req, `/thank-you?order=${encodeURIComponent(order.id)}`);
    response.cookies.set(DOWNLOAD_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: DOWNLOAD_SESSION_TTL_MS / 1000
    });
    return response;
  } catch {
    return redirect(req, "/checkout?stripe=payment-error");
  }
}
