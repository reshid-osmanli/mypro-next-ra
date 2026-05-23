import { NextResponse } from "next/server";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { DOWNLOAD_SESSION_TTL_MS, createSecureToken, hashToken } from "@/lib/order-access";

export async function GET(req: Request) {
  const ip = getRequestIp(req);
  if (isRateLimited(`order-redeem:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.redirect(new URL("/thank-you?expired=1", req.url));
  }
  const url = new URL(req.url);
  const claim = url.searchParams.get("claim")?.trim();
  if (!claim || claim.length < 32 || claim.length > 128) {
    return NextResponse.redirect(new URL("/thank-you?expired=1", req.url));
  }

  const now = new Date();
  const claimHash = hashToken(claim);
  const order = await prisma.order.findFirst({
    where: {
      downloadClaimHash: claimHash,
      downloadClaimUsedAt: null,
      downloadClaimExpiresAt: { gt: now },
      status: "paid"
    },
    include: {
      items: {
        include: {
          product: {
            include: { files: true }
          }
        }
      }
    }
  });

  if (!order) {
    return NextResponse.redirect(new URL("/thank-you?expired=1", req.url));
  }

  const sessionToken = createSecureToken();
  await prisma.order.update({
    where: { id: order.id },
    data: {
      downloadClaimUsedAt: now,
      downloadSessionHash: hashToken(sessionToken),
      downloadSessionExpiresAt: new Date(Date.now() + DOWNLOAD_SESSION_TTL_MS),
      downloadSessionUsedAt: null
    }
  });

  const response = NextResponse.redirect(new URL("/thank-you", req.url));
  response.cookies.set("kutubi-download-session", sessionToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DOWNLOAD_SESSION_TTL_MS / 1000
  });
  return response;
}
