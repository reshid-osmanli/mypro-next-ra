import { createHash, randomUUID } from "crypto";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
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

const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024;

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

function configureCloudinary() {
  const config = getCloudinaryConfig();
  if (!config) return;
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true
  });
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

function resolveResourceType(policy: UploadPolicy) {
  if (policy.private) return "raw";
  if (policy.kind === "image") return "image";
  return "auto";
}

export async function uploadToCloudinary(params: {
  bytes: Buffer;
  fileName: string;
  mimeType: string;
  policy: UploadPolicy;
}): Promise<CloudinaryUploadResult> {
  const config = requireCloudinaryConfig();
  configureCloudinary();

  const resourceType = resolveResourceType(params.policy);
  const publicId = safePublicId(params.fileName);
  const folder = uploadFolder(params.policy);
  const isLarge = params.bytes.length >= LARGE_FILE_THRESHOLD;

  const dataUri = `data:${params.mimeType};base64,${params.bytes.toString("base64")}`;

  let uploadResult: CloudinaryUploadResponse;
  if (isLarge) {
    uploadResult = (await cloudinary.uploader.upload_large(dataUri, {
      resource_type: resourceType,
      public_id: publicId,
      folder,
      overwrite: false,
      use_filename: false,
      unique_filename: false
    })) as CloudinaryUploadResponse;
  } else {
    uploadResult = (await cloudinary.uploader.upload(dataUri, {
      resource_type: resourceType,
      public_id: publicId,
      folder,
      overwrite: false,
      use_filename: false,
      unique_filename: false
    })) as CloudinaryUploadResponse;
  }

  if (!uploadResult.secure_url || !uploadResult.public_id) {
    throw new Error("Cloudinary upload failed: missing secure_url or public_id in response");
  }

  return {
    secureUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    resourceType: uploadResult.resource_type ?? resourceType,
    bytes: uploadResult.bytes ?? params.bytes.length,
    format: uploadResult.format,
    originalFilename: uploadResult.original_filename
  };
}
