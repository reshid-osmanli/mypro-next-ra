import { NextResponse, type NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { describeAllowedUploads, findUploadPolicy, hasValidUploadSignature, MAX_UPLOAD_BYTES, preferredUploadMimeType } from "@/lib/upload-policy";

export const runtime = "nodejs";

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

  const mimeType = preferredUploadMimeType(policy, file.name, file.type);
  let upload;
  try {
    upload = await uploadToCloudinary({
      bytes: buffer,
      fileName: file.name,
      mimeType,
      policy
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Cloudinary upload failed" }, { status: 500 });
  }

  return NextResponse.json({
    url: upload.secureUrl,
    title: file.name,
    mimeType,
    size: upload.bytes || file.size,
    private: policy.private,
    kind: policy.kind,
    label: policy.label,
    storage: "cloudinary",
    publicId: upload.publicId
  });
}
