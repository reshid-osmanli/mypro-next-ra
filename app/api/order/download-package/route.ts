import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { DOWNLOAD_SESSION_COOKIE, hashToken } from "@/lib/order-access";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { attachmentHeader, readStoredFile } from "@/lib/stored-files";
import { createZipArchive } from "@/lib/zip";

export const runtime = "nodejs";

function safeArchiveName(orderId: string) {
  return `kutubi-order-${orderId.slice(-8)}.zip`;
}

function fileDisplayName(productTitle: string, fileTitle: string) {
  return `${productTitle} - ${fileTitle}`.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 180);
}

function downloadHeaders(params: { fileName: string; contentType: string; contentLength: number }) {
  return {
    "Content-Type": params.contentType,
    "Content-Length": String(params.contentLength),
    "Content-Disposition": attachmentHeader(params.fileName),
    "X-Kutubi-Download-Name": encodeURIComponent(params.fileName),
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "X-Content-Type-Options": "nosniff",
    Pragma: "no-cache",
    Expires: "0"
  };
}

export async function POST(req: NextRequest) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const ip = getRequestIp(req);
  if (isRateLimited(`download-package:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة. حاول بعد قليل" }, { status: 429 });
  }

  const token = req.cookies.get(DOWNLOAD_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "انتهت صلاحية جلسة التحميل" }, { status: 401 });
  }

  const sessionHash = hashToken(token);
  const now = new Date();
  const order = await prisma.order.findFirst({
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

  if (!order) {
    return NextResponse.json({ error: "جلسة التحميل منتهية الصلاحية أو تم استخدامها" }, { status: 403 });
  }

  const files = order.items.flatMap((item) =>
    item.product.files.map((file) => ({
      file,
      productTitle: item.productTitle
    }))
  );

  if (!files.length) {
    return NextResponse.json({ error: "لا توجد ملفات مرفقة بهذا الطلب" }, { status: 404 });
  }

  let payload: Buffer;
  let fileName: string;
  let contentType: string;

  try {
    if (files.length === 1) {
      const stored = await readStoredFile(files[0].file);
      payload = stored.data;
      fileName = files[0].file.title;
      contentType = stored.contentType || files[0].file.mimeType;
    } else {
      const zipFiles = [];
      for (const item of files) {
        const stored = await readStoredFile(item.file);
        zipFiles.push({
          name: fileDisplayName(item.productTitle, item.file.title),
          data: stored.data
        });
      }
      payload = createZipArchive(zipFiles);
      fileName = safeArchiveName(order.id);
      contentType = "application/zip";
    }
  } catch {
    return NextResponse.json({ error: "تعذر قراءة ملفات الطلب من التخزين" }, { status: 404 });
  }

  const consumed = await prisma.order.updateMany({
    where: {
      id: order.id,
      downloadSessionHash: sessionHash,
      downloadSessionExpiresAt: { gt: now },
      downloadSessionUsedAt: null,
      status: "paid"
    },
    data: {
      downloadSessionUsedAt: new Date(),
      downloadSessionHash: null,
      downloadSessionExpiresAt: null
    }
  });

  if (consumed.count !== 1) {
    return NextResponse.json({ error: "جلسة التحميل منتهية الصلاحية أو تم استخدامها" }, { status: 403 });
  }

  const response = new NextResponse(payload, {
    headers: downloadHeaders({
      fileName,
      contentType,
      contentLength: payload.length
    })
  });

  response.cookies.set(DOWNLOAD_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  return response;
}

export async function GET() {
  return NextResponse.json({ error: "Use POST for secure downloads." }, { status: 405, headers: { Allow: "POST" } });
}
