import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { hashToken } from "@/lib/download-token";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { attachmentHeader, readStoredFile } from "@/lib/stored-files";

export const runtime = "nodejs";

const schema = z.object({
  fileId: z.string().trim().min(1).max(128),
  token: z.string().trim().regex(/^[a-f0-9]{64}$/i)
});

export async function POST(req: NextRequest) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const ip = getRequestIp(req);
  if (isRateLimited(`download:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many download attempts. Try again later." }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Unable to read download request." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid download request." }, { status: 400 });
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
    return NextResponse.json({ error: "The download token is expired or already used." }, { status: 403 });
  }

  const consumed = await prisma.downloadToken.updateMany({
    where: { id: downloadToken.id, usedAt: null },
    data: { usedAt: new Date() }
  });

  if (consumed.count !== 1) {
    return NextResponse.json({ error: "The download token is expired or already used." }, { status: 403 });
  }

  let storedFile: Awaited<ReturnType<typeof readStoredFile>>;
  try {
    storedFile = await readStoredFile(downloadToken.file);
  } catch {
    return NextResponse.json({ error: "The file is not available on storage." }, { status: 404 });
  }

  return new NextResponse(storedFile.data, {
    headers: {
      "Content-Type": storedFile.contentType,
      "Content-Length": String(storedFile.contentLength ?? storedFile.data.length),
      "Content-Disposition": attachmentHeader(downloadToken.file.title),
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "X-Content-Type-Options": "nosniff",
      Pragma: "no-cache",
      Expires: "0"
    }
  });
}

export async function GET() {
  return NextResponse.json({ error: "Use POST for secure downloads." }, { status: 405, headers: { Allow: "POST" } });
}
