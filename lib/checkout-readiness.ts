import { prisma } from "@/lib/db";
import { isSafeCloudinaryStoredUrl } from "@/lib/upload-policy";
import { readStoredFile } from "@/lib/stored-files";

type ProductFile = {
  id: string;
  title: string;
  url: string;
  mimeType: string;
};

export type CheckoutReadinessResult =
  | { ok: true; productIds: string[] }
  | { ok: false; error: string };

function isSupportedFileUrl(url: string) {
  const normalized = url.trim();
  return normalized.startsWith("/private-uploads/") || isSafeCloudinaryStoredUrl(normalized);
}

async function verifyFileReachable(file: ProductFile) {
  if (!isSupportedFileUrl(file.url)) {
    return { ok: false as const, reason: `ملف "${file.title}" غير مُخزَّن بشكل آمن` };
  }

  if (normalizedUsesEphemeralDisk(file.url) && process.env.VERCEL) {
    return {
      ok: false as const,
      reason: `ملف "${file.title}" على تخزين محلي غير متاح على Vercel. ارفعه إلى Cloudinary من لوحة الإدارة.`
    };
  }

  try {
    const stored = await readStoredFile(file);
    if (!stored.data.length) {
      return { ok: false as const, reason: `ملف "${file.title}" فارغ أو تالف` };
    }
    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: `تعذر الوصول إلى ملف "${file.title}" قبل الدفع` };
  }
}

function normalizedUsesEphemeralDisk(url: string) {
  return url.trim().startsWith("/private-uploads/");
}

export async function validateCheckoutReadiness(productIds: string[]): Promise<CheckoutReadinessResult> {
  const uniqueIds = [...new Set(productIds)];
  if (!uniqueIds.length) {
    return { ok: false, error: "السلة فارغة" };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: uniqueIds }, status: "published" },
    include: { files: true }
  });

  if (products.length !== uniqueIds.length) {
    return { ok: false, error: "بعض المنتجات غير متاحة أو لم تعد منشورة. أزلها من السلة وحاول مرة أخرى." };
  }

  for (const product of products) {
    if (!product.files.length) {
      return {
        ok: false,
        error: `المنتج "${product.title}" لا يحتوي ملفات قابلة للتنزيل. لا يمكن بدء الدفع حتى يُرفق ملف سليم من الإدارة.`
      };
    }

    for (const file of product.files) {
      const check = await verifyFileReachable(file);
      if (!check.ok) {
        return {
          ok: false,
          error: `${check.reason}. تم إيقاف الدفع لحماية المشتري.`
        };
      }
    }
  }

  return { ok: true, productIds: uniqueIds };
}
