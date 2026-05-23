import { NextResponse, type NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { hashToken } from "@/lib/download-token";
import { rejectUntrustedOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

const schema = z.object({
  fileId: z.string().trim().min(1).max(128),
  token: z.string().trim().regex(/^[a-f0-9]{64}$/i)
});

function resolveInside(baseDir: string, unsafeName: string) {
  const root = path.resolve(baseDir);
  const filepath = path.resolve(root, path.basename(unsafeName));

  if (!filepath.startsWith(`${root}${path.sep}`)) return null;
  return filepath;
}

function attachmentHeader(fileName: string) {
  const fallback = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-") || "download";
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function POST(req: NextRequest) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const ip = getRequestIp(req);
  if (isRateLimited(`download:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة. حاول بعد قليل" }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "تعذر قراءة بيانات التحميل" }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات التحميل غير صالحة" }, { status: 400 });
  }

  const tokenHash = hashToken(parsed.data.token);
  const now = new Date();

  const downloadToken = await prisma.downloadToken.findFirst({
    where: {
      fileId: parsed.data.fileId,
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now },
      order: { is: { status: "paid" } }
    },
    include: {
      file: true,
      order: { include: { items: { include: { product: { include: { files: true } } } } } }
    }
  });

  if (!downloadToken) {
    return NextResponse.json({ error: "رابط التحميل منتهي الصلاحية أو تم استخدامه" }, { status: 403 });
  }

  const consumed = await prisma.downloadToken.updateMany({
    where: { id: downloadToken.id, usedAt: null },
    data: { usedAt: new Date() }
  });

  if (consumed.count !== 1) {
    return NextResponse.json({ error: "رابط التحميل منتهي الصلاحية أو تم استخدامه" }, { status: 403 });
  }

  let filePath: string | null = null;
  if (downloadToken.file.url.startsWith("/private-uploads/")) {
    filePath = resolveInside(path.join(process.cwd(), "storage", "uploads"), downloadToken.file.url.replace("/private-uploads/", ""));
  }

  if (!filePath) {
    return NextResponse.json({ error: "تعذر الوصول إلى الملف" }, { status: 403 });
  }

  let data: Buffer;
  try {
    data = await readFile(filePath);
  } catch {
    return NextResponse.json({ error: "الملف غير موجود على الخادم" }, { status: 404 });
  }

  return new NextResponse(data, {
    headers: {
      "Content-Type": downloadToken.file.mimeType,
      "Content-Length": String(data.length),
      "Content-Disposition": attachmentHeader(downloadToken.file.title),
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "X-Content-Type-Options": "nosniff",
      Pragma: "no-cache",
      Expires: "0"
    }
  });
}

export async function GET() {
  return NextResponse.json({ error: "استخدم POST للتحميل الآمن" }, { status: 405, headers: { Allow: "POST" } });
}
