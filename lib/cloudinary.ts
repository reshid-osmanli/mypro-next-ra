import { createHash, randomUUID } from "crypto";
import path from "path";
import type { UploadPolicy } from "./upload-policy";

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  resource_type?: string;
  bytes?: number;
  format?: string;
  original_filename?: string;
};

export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format?: string;
  originalFilename?: string;
};

export function getCloudinaryConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function requireCloudinaryConfig() {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error("Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }
  return config;
}

function signUploadParams(params: Record<string, string | number | boolean | undefined>, apiSecret: string) {
  const payload = Object.entries(params)
    .filter(([, value]) => typeof value !== "undefined" && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

function safePublicId(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const stem =
    path
      .basename(fileName, extension)
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 72) || "kutubi-file";

  return `${Date.now()}-${randomUUID()}-${stem}${extension}`;
}

function uploadFolder(policy: UploadPolicy) {
  return policy.private ? "kutubi/private-products" : "kutubi/public-images";
}

export async function uploadToCloudinary(params: {
  bytes: Buffer;
  fileName: string;
  mimeType: string;
  policy: UploadPolicy;
}) {
  const config = requireCloudinaryConfig();
  const resourceType = params.policy.private ? "raw" : "image";
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadParams = {
    folder: uploadFolder(params.policy),
    public_id: safePublicId(params.fileName),
    timestamp,
    overwrite: false,
    use_filename: false,
    unique_filename: false
  };

  const formData = new FormData();
  formData.set("file", new Blob([params.bytes], { type: params.mimeType }), params.fileName);
  formData.set("api_key", config.apiKey);
  formData.set("folder", uploadParams.folder);
  formData.set("public_id", uploadParams.public_id);
  formData.set("timestamp", String(timestamp));
  formData.set("overwrite", "false");
  formData.set("use_filename", "false");
  formData.set("unique_filename", "false");
  formData.set("signature", signUploadParams(uploadParams, config.apiSecret));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/${resourceType}/upload`, {
    method: "POST",
    body: formData
  });

  const data = (await res.json().catch(() => ({}))) as CloudinaryUploadResponse & { error?: { message?: string } };
  if (!res.ok || !data.secure_url || !data.public_id) {
    const reason = data.error?.message ? `: ${data.error.message}` : "";
    throw new Error(`Cloudinary upload failed${reason}`);
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type ?? resourceType,
    bytes: data.bytes ?? params.bytes.length,
    format: data.format,
    originalFilename: data.original_filename
  } satisfies CloudinaryUploadResult;
}
