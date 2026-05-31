import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { decryptRefreshToken, ensureKutubiDriveFolder, refreshGoogleAccessToken, uploadBufferToDrive } from "@/lib/google-drive";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { PURCHASE_SESSION_COOKIE, verifyPurchaseSession } from "@/lib/purchase-access";
import { readStoredFile } from "@/lib/stored-files";
import { rejectUntrustedOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

function driveSafeName(productTitle: string, fileTitle: string) {
  return `${productTitle} - ${fileTitle}`.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 180);
}

export async function POST(req: NextRequest) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const email = verifyPurchaseSession(req.cookies.get(PURCHASE_SESSION_COOKIE)?.value);
  if (!email) {
    return NextResponse.json({ error: "Purchase session is expired." }, { status: 401 });
  }

  const ip = getRequestIp(req);
  if (isRateLimited(`drive-sync:${email}:${ip}`, 2, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many sync attempts. Try again later." }, { status: 429 });
  }

  const connection = await prisma.googleDriveConnection.findUnique({ where: { email } });
  if (!connection) {
    return NextResponse.json({ error: "Google Drive is not connected." }, { status: 409 });
  }

  const orders = await prisma.order.findMany({
    where: { email, status: "paid", purchaseTrackingConsent: true },
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

  const existing = await prisma.driveFileSync.findMany({
    where: { email },
    select: { orderId: true, fileId: true }
  });
  const syncedKeys = new Set(existing.map((item) => `${item.orderId}:${item.fileId}`));

  const pending = orders.flatMap((order) =>
    order.items.flatMap((item) =>
      item.product.files
        .filter((file) => !syncedKeys.has(`${order.id}:${file.id}`))
        .map((file) => ({
          orderId: order.id,
          file,
          productTitle: item.productTitle
        }))
    )
  );

  if (!pending.length) {
    return NextResponse.json({ ok: true, uploaded: 0, skipped: existing.length });
  }

  const accessToken = await refreshGoogleAccessToken(decryptRefreshToken(connection.refreshTokenEncrypted));
  const folderId = await ensureKutubiDriveFolder(accessToken);
  let uploaded = 0;

  for (const item of pending) {
    const stored = await readStoredFile(item.file);
    const driveFile = await uploadBufferToDrive({
      accessToken,
      folderId,
      name: driveSafeName(item.productTitle, item.file.title),
      mimeType: stored.contentType || item.file.mimeType,
      data: stored.data
    });

    await prisma.driveFileSync.create({
      data: {
        email,
        orderId: item.orderId,
        fileId: item.file.id,
        driveFileId: driveFile.id
      }
    });
    uploaded += 1;
  }

  await prisma.googleDriveConnection.update({
    where: { email },
    data: { lastSyncedAt: new Date() }
  });

  return NextResponse.json({ ok: true, uploaded, skipped: existing.length });
}
