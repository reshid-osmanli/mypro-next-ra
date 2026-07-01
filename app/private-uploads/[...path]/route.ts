import { NextResponse, type NextRequest } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { requireAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};

function getMimeType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

async function tryReadFile(targetPath: string) {
  try {
    const info = await stat(targetPath);
    if (!info.isFile()) return null;
    const buffer = await readFile(targetPath);
    return { buffer, info };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { path: pathSegments = [] } = await params;
  if (!pathSegments.length) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const relativePath = pathSegments.join("/");
  if (relativePath.includes("..") || relativePath.includes("\0")) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const storageUploadsDir = path.resolve(process.cwd(), "storage", "uploads");
  const targetPath = path.resolve(storageUploadsDir, relativePath);

  if (!targetPath.startsWith(`${storageUploadsDir}${path.sep}`) && targetPath !== storageUploadsDir) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const fileData = await tryReadFile(targetPath);

  if (!fileData) {
    return new NextResponse("File Not Found", { status: 404 });
  }

  const contentType = getMimeType(relativePath);

  return new NextResponse(fileData.buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileData.info.size),
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
