export type UploadKind = "document" | "presentation" | "spreadsheet" | "image";

export type UploadPolicy = {
  kind: UploadKind;
  label: string;
  extensions: string[];
  mimeTypes: string[];
  private: boolean;
};

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export const UPLOAD_POLICIES: UploadPolicy[] = [
  {
    kind: "document",
    label: "PDF",
    extensions: [".pdf"],
    mimeTypes: ["application/pdf"],
    private: true
  },
  {
    kind: "presentation",
    label: "PowerPoint",
    extensions: [".ppt", ".pptx", ".pps", ".ppsx"],
    mimeTypes: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow"
    ],
    private: true
  },
  {
    kind: "document",
    label: "Word",
    extensions: [".doc", ".docx"],
    mimeTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    private: true
  },
  {
    kind: "spreadsheet",
    label: "Excel",
    extensions: [".xls", ".xlsx"],
    mimeTypes: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ],
    private: true
  },
  {
    kind: "image",
    label: "صورة غلاف",
    extensions: [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    private: false
  }
];

export const UPLOAD_ACCEPT = UPLOAD_POLICIES.flatMap((policy) => policy.extensions).join(",");
export const PRIVATE_UPLOAD_ACCEPT = UPLOAD_POLICIES.filter((policy) => policy.private).flatMap((policy) => policy.extensions).join(",");

const genericMimeTypes = new Set(["", "application/octet-stream", "binary/octet-stream"]);
const zipMimeTypes = new Set(["application/zip", "application/x-zip-compressed"]);

export function normalizeFileExtension(fileName: string) {
  const cleanName = fileName.trim().toLowerCase();
  const dotIndex = cleanName.lastIndexOf(".");
  if (dotIndex <= 0) return "";
  return cleanName.slice(dotIndex);
}

export function findUploadPolicy(fileName: string, mimeType = "") {
  const extension = normalizeFileExtension(fileName);
  return UPLOAD_POLICIES.find((policy) => {
    if (!policy.extensions.includes(extension)) return false;
    if (policy.mimeTypes.includes(mimeType)) return true;
    if (genericMimeTypes.has(mimeType)) return true;
    return zipMimeTypes.has(mimeType) && [".docx", ".pptx", ".ppsx", ".xlsx"].includes(extension);
  });
}

export function isKnownUploadMimeType(mimeType: string) {
  return UPLOAD_POLICIES.some((policy) => policy.mimeTypes.includes(mimeType));
}

export function isKnownPrivateUploadMimeType(mimeType: string) {
  return UPLOAD_POLICIES.some((policy) => policy.private && policy.mimeTypes.includes(mimeType));
}

export function preferredUploadMimeType(policy: UploadPolicy, fileName: string, mimeType = "") {
  if (policy.mimeTypes.includes(mimeType)) return mimeType;

  const extension = normalizeFileExtension(fileName);
  const byExtension: Record<string, string> = {
    ".pdf": "application/pdf",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".pps": "application/vnd.ms-powerpoint",
    ".ppsx": "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif"
  };

  return byExtension[extension] ?? policy.mimeTypes[0];
}

export function isSafeCloudinaryStoredUrl(url: string) {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const resourceType = pathParts[1];
    const deliveryType = pathParts[2];

    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "res.cloudinary.com" &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash &&
      pathParts.length >= 5 &&
      ["image", "raw"].includes(resourceType) &&
      deliveryType === "upload"
    );
  } catch {
    return false;
  }
}

export function isSafeCloudinaryImageUrl(url: string) {
  if (!isSafeCloudinaryStoredUrl(url)) return false;

  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    return pathParts[1] === "image";
  } catch {
    return false;
  }
}

export function isSafeCloudinaryPrivateUploadUrl(url: string) {
  if (!isSafeCloudinaryStoredUrl(url)) return false;

  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    return pathParts[1] === "raw";
  } catch {
    return false;
  }
}

export function isSafeStoredUploadUrl(url: string) {
  return /^\/(?:uploads|private-uploads)\/[a-zA-Z0-9_.-]+$/.test(url) || isSafeCloudinaryStoredUrl(url);
}

export function isSafePrivateStoredUploadUrl(url: string) {
  return /^\/private-uploads\/[a-zA-Z0-9_.-]+$/.test(url) || isSafeCloudinaryPrivateUploadUrl(url);
}

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((byte, index) => bytes[index] === byte);
}

function containsAscii(bytes: Uint8Array, text: string) {
  const needle = Array.from(text, (char) => char.charCodeAt(0));
  if (!needle.length || bytes.length < needle.length) return false;

  for (let i = 0; i <= bytes.length - needle.length; i += 1) {
    let matched = true;
    for (let j = 0; j < needle.length; j += 1) {
      if (bytes[i + j] !== needle[j]) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }

  return false;
}

export function hasValidUploadSignature(bytes: Uint8Array, fileName: string) {
  const extension = normalizeFileExtension(fileName);

  if (extension === ".pdf") return startsWith(bytes, [0x25, 0x50, 0x44, 0x46]);
  if ([".png"].includes(extension)) return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47]);
  if ([".jpg", ".jpeg"].includes(extension)) return startsWith(bytes, [0xff, 0xd8, 0xff]);
  if (extension === ".gif") {
    return startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
  }
  if (extension === ".webp") {
    return startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }
  if ([".docx", ".pptx", ".ppsx", ".xlsx"].includes(extension)) {
    if (!startsWith(bytes, [0x50, 0x4b]) || !containsAscii(bytes, "[Content_Types].xml")) return false;
    if (extension === ".docx") return containsAscii(bytes, "word/");
    if ([".pptx", ".ppsx"].includes(extension)) return containsAscii(bytes, "ppt/");
    if (extension === ".xlsx") return containsAscii(bytes, "xl/");
  }
  if ([".doc", ".ppt", ".pps", ".xls"].includes(extension)) {
    return startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  }

  return false;
}

export function describeAllowedUploads() {
  return "PDF, PPT, PPTX, PPSX, DOC, DOCX, XLS, XLSX, PNG, JPG, WEBP, GIF";
}

export function describeAllowedPrivateUploads() {
  return "PDF, PPT, PPTX, PPSX, DOC, DOCX, XLS, XLSX";
}
