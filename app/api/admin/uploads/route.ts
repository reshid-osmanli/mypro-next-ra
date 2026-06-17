import { NextResponse, type NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { getCloudinaryConfig, uploadToCloudinary } from "@/lib/cloudinary";
import { saveUploadToLocalStorage } from "@/lib/local-uploads";
import { describeAllowedUploads, findUploadPolicy, hasValidUploadSignature, MAX_UPLOAD_BYTES, preferredUploadMimeType } from "@/lib/upload-policy";
import { reportApiFailure, reportCaughtError, routeContext } from "@/lib/report-caught-error";

export const runtime = "nodejs";

function requiresPersistentStorage() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const ip = getRequestIp(req);
  if (isRateLimited(`admin-uploads:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة. حاول بعد قليل" }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (error) {
    console.error("[admin/uploads:form-data]", error);
    return NextResponse.json({ error: "تعذر قراءة الملف المرفوع. تأكد من أن الطلب يرسل multipart/form-data وأن حجم الملف مناسب." }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
  }

  const policy = findUploadPolicy(file.name, file.type);
  if (!policy) {
    return NextResponse.json({ error: `نوع الملف غير مسموح. الأنواع المقبولة: ${describeAllowedUploads()}` }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: "الملف فارغ. اختر ملفاً صالحاً." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidUploadSignature(buffer, file.name)) {
    return NextResponse.json({ error: "توقيع الملف لا يطابق نوعه. تأكد من أن الملف أصلي وغير معطوب" }, { status: 400 });
  }

  const mimeType = preferredUploadMimeType(policy, file.name, file.type);
  const cloudinaryConfig = getCloudinaryConfig();
  if (!cloudinaryConfig && requiresPersistentStorage()) {
    await reportApiFailure(req, "رفع الملفات على الاستضافة يحتاج ضبط Cloudinary", { statusCode: 500, area: "admin" });
    return NextResponse.json(
      { error: "رفع الملفات على الاستضافة يحتاج ضبط Cloudinary: CLOUDINARY_CLOUD_NAME و CLOUDINARY_API_KEY و CLOUDINARY_API_SECRET." },
      { status: 500 }
    );
  }

  let upload;
  let storage = "local";
  try {
    if (cloudinaryConfig) {
      upload = await uploadToCloudinary({
        bytes: buffer,
        fileName: file.name,
        mimeType,
        policy
      });
      storage = "cloudinary";
    } else {
      upload = await saveUploadToLocalStorage({
        bytes: buffer,
        fileName: file.name,
        policy
      });
    }
  } catch (error) {
    await reportCaughtError(error, { ...routeContext(req, "admin"), statusCode: 500 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }

  return NextResponse.json({
    url: upload.secureUrl,
    title: file.name,
    mimeType,
    size: upload.bytes || file.size,
    private: policy.private,
    kind: policy.kind,
    label: policy.label,
    storage,
    publicId: upload.publicId
  });
}
