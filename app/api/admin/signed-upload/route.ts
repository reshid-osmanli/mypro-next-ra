import { NextResponse, type NextRequest } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { generateSignedUploadParams } from "@/lib/cloudinary";
import { findUploadPolicy, preferredUploadMimeType } from "@/lib/upload-policy";
import { reportCaughtError, routeContext } from "@/lib/report-caught-error";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const ip = getRequestIp(req);
  if (isRateLimited(`admin-signed-upload:${ip}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة. حاول بعد قليل" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { fileName, mimeType } = body;

    if (!fileName || !mimeType) {
      return NextResponse.json({ error: "fileName و mimeType مطلوبان" }, { status: 400 });
    }

    const policy = findUploadPolicy(fileName, mimeType);
    if (!policy) {
      return NextResponse.json({ error: `نوع الملف غير مسموح. الأنواع المقبولة: PDF, PPT, PPTX, PPSX, DOC, DOCX, XLS, XLSX, PNG, JPG, WEBP, GIF, MP4, WEBM, MOV` }, { status: 400 });
    }

    const resolvedMimeType = preferredUploadMimeType(policy, fileName, mimeType);
    const { uploadUrl, formData } = generateSignedUploadParams({
      fileName,
      mimeType: resolvedMimeType,
      policy
    });

    return NextResponse.json({
      uploadUrl,
      formData,
      resourceType: policy.private ? "raw" : "image",
      mimeType: resolvedMimeType,
      private: policy.private,
      kind: policy.kind,
      label: policy.label
    });
  } catch (error) {
    reportCaughtError(error, { ...routeContext(req, "admin"), statusCode: 500 });
    return NextResponse.json({ error: "تعذر إنشاء رابط الرفع الموقّع" }, { status: 500 });
  }
}
