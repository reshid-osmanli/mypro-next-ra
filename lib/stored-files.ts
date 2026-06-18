import { readFile } from "fs/promises";
import path from "path";
import { isSafeCloudinaryStoredUrl } from "./upload-policy";

type StoredFile = {
  title: string;
  url: string;
  mimeType: string;
};

function resolveInside(baseDir: string, unsafeName: string) {
  const root = path.resolve(baseDir);
  const filepath = path.resolve(root, path.basename(unsafeName));

  if (!filepath.startsWith(`${root}${path.sep}`)) return null;
  return filepath;
}

export function attachmentHeader(fileName: string) {
  const fallback = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-") || "download";
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function readStoredFile(file: StoredFile) {
  if (file.url.startsWith("/private-uploads/")) {
    const filePath = resolveInside(path.join(process.cwd(), "storage", "uploads"), file.url.replace("/private-uploads/", ""));
    if (!filePath) {
      throw new Error("Unsafe private upload path");
    }
    return {
      data: await readFile(filePath),
      contentType: file.mimeType,
      contentLength: null as number | null
    };
  }

  if (isSafeCloudinaryStoredUrl(file.url)) {
    const response = await fetch(file.url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Cloudinary download failed with ${response.status}`);
    }
    const contentType = response.headers.get("content-type") ?? file.mimeType;
    const contentLengthHeader = response.headers.get("content-length");
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;
    return {
      data: Buffer.from(await response.arrayBuffer()),
      contentType,
      contentLength: Number.isFinite(contentLength) ? contentLength : null
    };
  }

  throw new Error("Unsupported stored file URL");
}
