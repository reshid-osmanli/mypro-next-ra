import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendSecurityEmail } from "@/lib/mailer";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { PURCHASE_ACCESS_TOKEN_TTL_MS, createPurchaseAccessToken, hashPurchaseToken, normalizePurchaseEmail } from "@/lib/purchase-access";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email().max(160)
});

export async function POST(req: Request) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const ip = getRequestIp(req);
  if (isRateLimited(`purchase-link:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const email = normalizePurchaseEmail(parsed.data.email);
  const orderCount = await prisma.order.count({
    where: { email, status: "paid", purchaseTrackingConsent: true }
  });

  if (orderCount > 0) {
    const token = createPurchaseAccessToken();
    await prisma.purchaseAccessToken.create({
      data: {
        email,
        tokenHash: hashPurchaseToken(token),
        expiresAt: new Date(Date.now() + PURCHASE_ACCESS_TOKEN_TTL_MS)
      }
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
    const link = `${siteUrl}/api/purchases/verify?token=${encodeURIComponent(token)}`;
    await sendSecurityEmail({
      to: email,
      subject: "رابط مشترياتك في كتبي",
      text: [`مرحباً،`, ``, `افتح هذا الرابط خلال 15 دقيقة لعرض مشترياتك المحفوظة:`, link, ``, `إذا لم تطلب هذا الرابط فتجاهل الرسالة.`].join("\n")
    });
  }

  return NextResponse.json({ ok: true });
}
