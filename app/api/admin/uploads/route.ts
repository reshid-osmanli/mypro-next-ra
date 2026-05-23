import { NextResponse, type NextRequest } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireAdminRequest } from "@/lib/admin-auth";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { describeAllowedUploads, findUploadPolicy, hasValidUploadSignature, MAX_UPLOAD_BYTES, preferredUploadMimeType } from "@/lib/upload-policy";

export const runtime = "nodejs";

function safeStoredName(originalName: string) {
  const extension = path.extname(originalName).toLowerCase();
  const stem =
    path
      .basename(originalName, extension)
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 72) || "kutubi-file";

  return `${Date.now()}-${randomUUID()}-${stem}${extension}`;
}

function resolveInside(baseDir: string, filename: string) {
  const root = path.resolve(baseDir);
  const filepath = path.resolve(root, path.basename(filename));

  if (!filepath.startsWith(`${root}${path.sep}`)) {
    throw new Error("Unsafe upload path");
  }

  return filepath;
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const ip = getRequestIp(req);
  if (isRateLimited(`admin-uploads:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة. حاول بعد قليل" }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
  }

  const policy = findUploadPolicy(file.name, file.type);
  if (!policy) {
    return NextResponse.json({ error: `نوع الملف غير مسموح. الأنواع المقبولة: ${describeAllowedUploads()}` }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "حجم الملف غير مناسب. الحد الأقصى 50MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidUploadSignature(buffer, file.name)) {
    return NextResponse.json({ error: "توقيع الملف لا يطابق نوعه. تأكد من أن الملف أصلي وغير معطوب" }, { status: 400 });
  }

  const filename = safeStoredName(file.name);
  const uploadDir = policy.private ? path.join(process.cwd(), "storage", "uploads") : path.join(process.cwd(), "public", "uploads");

  await mkdir(uploadDir, { recursive: true });
  const filepath = resolveInside(uploadDir, filename);
  await writeFile(filepath, buffer);

  return NextResponse.json({
    url: policy.private ? `/private-uploads/${filename}` : `/uploads/${filename}`,
    title: file.name,
    mimeType: preferredUploadMimeType(policy, file.name, file.type),
    size: file.size,
    private: policy.private,
    kind: policy.kind,
    label: policy.label
  });
}
