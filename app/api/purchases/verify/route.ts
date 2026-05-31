import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { PURCHASE_SESSION_COOKIE, PURCHASE_SESSION_TTL_SECONDS, hashPurchaseToken, signPurchaseSession } from "@/lib/purchase-access";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ip = getRequestIp(req);
  if (isRateLimited(`purchase-verify:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.redirect(new URL("/purchases?error=rate-limited", req.url));
  }

  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!token || token.length < 32 || token.length > 128) {
    return NextResponse.redirect(new URL("/purchases?error=invalid", req.url));
  }

  const now = new Date();
  const accessToken = await prisma.purchaseAccessToken.findFirst({
    where: {
      tokenHash: hashPurchaseToken(token),
      usedAt: null,
      expiresAt: { gt: now }
    }
  });

  if (!accessToken) {
    return NextResponse.redirect(new URL("/purchases?error=expired", req.url));
  }

  await prisma.purchaseAccessToken.update({
    where: { id: accessToken.id },
    data: { usedAt: now }
  });

  const response = NextResponse.redirect(new URL("/purchases", req.url));
  response.cookies.set(PURCHASE_SESSION_COOKIE, signPurchaseSession(accessToken.email), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PURCHASE_SESSION_TTL_SECONDS
  });

  return response;
}
