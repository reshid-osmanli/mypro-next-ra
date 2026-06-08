import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { decryptRefreshToken, ensureKutubiDriveFolder, refreshGoogleAccessToken, uploadBufferToDrive } from "@/lib/google-drive";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { readStoredFile } from "@/lib/stored-files";
import { rejectUntrustedOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

function driveSafeName(productTitle: string, fileTitle: string) {
  return `${productTitle} - ${fileTitle}`.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 180);
}

export async function POST(req: NextRequest) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Sign in to sync your purchases." }, { status: 401 });
  }

  const ip = getRequestIp(req);
  if (isRateLimited(`drive-sync:${email}:${ip}`, 2, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many sync attempts. Try again later." }, { status: 429 });
  }

  const connection = await prisma.googleDriveConnection.findUnique({ where: { email } });
  if (!connection) {
    return NextResponse.json({ error: "Google Drive is not connected." }, { status: 409 });
  }

  let orders: Awaited<ReturnType<typeof prisma.order.findMany>>;
  try {
    orders = await prisma.order.findMany({
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
  } catch (e) {
    console.error("Failed to fetch orders:", e);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }

  let existing: { orderId: string; fileId: string }[];
  try {
    const existingRaw = await prisma.driveFileSync.findMany({
      where: { email },
      select: { orderId: true, fileId: true }
    });
    existing = existingRaw;
  } catch (e) {
    console.error("Failed to check existing syncs:", e);
    return NextResponse.json({ error: "Failed to check existing file syncs." }, { status: 500 });
  }
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

  let accessToken: string;
  try {
    accessToken = await refreshGoogleAccessToken(decryptRefreshToken(connection.refreshTokenEncrypted));
  } catch (e) {
    console.error("Failed to refresh Google access token:", e);
    return NextResponse.json({ error: "Google Drive authentication failed. Please reconnect." }, { status: 401 });
  }

  let folderId: string;
  try {
    folderId = await ensureKutubiDriveFolder(accessToken);
  } catch (e) {
    console.error("Failed to ensure Drive folder:", e);
    return NextResponse.json({ error: "Failed to create Google Drive folder." }, { status: 500 });
  }

  let uploaded = 0;
  const failedFiles: string[] = [];

  for (const item of pending) {
    try {
      const stored = await readStoredFile(item.file);
      if (!stored.data || stored.data.length === 0) {
        failedFiles.push(item.file.title);
        continue;
      }
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
    } catch (e) {
      console.error(`Failed to upload file ${item.file.title}:`, e);
      failedFiles.push(item.file.title);
    }
  }

  if (uploaded === 0 && failedFiles.length > 0) {
    return NextResponse.json({ error: `Failed to upload files: ${failedFiles.join(", ")}` }, { status: 500 });
  }

  try {
    await prisma.googleDriveConnection.update({
      where: { email },
      data: { lastSyncedAt: new Date() }
    });
  } catch (e) {
    console.error("Failed to update sync timestamp:", e);
  }

  return NextResponse.json({ ok: true, uploaded, skipped: existing.length, failed: failedFiles.length > 0 ? failedFiles : undefined });
}
