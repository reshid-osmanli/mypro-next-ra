import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { DOWNLOAD_SESSION_COOKIE } from "@/lib/order-access";
import { createSecureToken, hashToken, DOWNLOAD_TOKEN_TTL_MS } from "@/lib/download-token";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { rejectUntrustedOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const ip = getRequestIp(req);
  if (isRateLimited(`issue-download-links:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة. حاول بعد قليل" }, { status: 429 });
  }

  const token = req.cookies.get(DOWNLOAD_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "انتهت صلاحية جلسة التحميل" }, { status: 401 });
  }

  const sessionHash = hashToken(token);
  const now = new Date();

  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findFirst({
      where: {
        downloadSessionHash: sessionHash,
        downloadSessionExpiresAt: { gt: now },
        downloadSessionUsedAt: null,
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

    if (!existing) return null;

    const files = existing.items.flatMap((item) => item.product.files);
    if (!files.length) return { existing, files: [] as typeof files };

    const downloadTokens: Array<{ id: string; title: string; mimeType: string; size: number; productTitle: string; token: string }> = [];
    for (const file of files) {
      const fileToken = createSecureToken();
      await tx.downloadToken.create({
        data: {
          orderId: existing.id,
          fileId: file.id,
          tokenHash: hashToken(fileToken),
          expiresAt: new Date(Date.now() + DOWNLOAD_TOKEN_TTL_MS)
        }
      });
      const productTitle = existing.items.find((item) => item.product.files.some((entry) => entry.id === file.id))?.productTitle ?? existing.customerName;
      downloadTokens.push({
        id: file.id,
        title: file.title,
        mimeType: file.mimeType,
        size: file.size,
        productTitle,
        token: fileToken
      });
    }

    await tx.order.update({
      where: { id: existing.id },
      data: {
        downloadSessionUsedAt: now,
        downloadSessionHash: null,
        downloadSessionExpiresAt: null
      }
    });

    return { existing, files: downloadTokens };
  });

  if (!order) {
    return NextResponse.json({ error: "رابط التحميل منتهي الصلاحية أو تم استخدامه" }, { status: 403 });
  }

  const response = NextResponse.json({
    ok: true,
    files: order.files,
    orderId: order.existing.id
  });

  response.cookies.set(DOWNLOAD_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  return response;
}
