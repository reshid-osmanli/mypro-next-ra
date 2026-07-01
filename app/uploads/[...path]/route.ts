import { NextResponse, type NextRequest } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf"
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
  const { path: pathSegments = [] } = await params;
  if (!pathSegments.length) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const relativePath = pathSegments.join("/");
  if (relativePath.includes("..") || relativePath.includes("\0")) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const publicUploadsDir = path.resolve(process.cwd(), "public", "uploads");
  const targetPath = path.resolve(publicUploadsDir, relativePath);

  if (!targetPath.startsWith(`${publicUploadsDir}${path.sep}`) && targetPath !== publicUploadsDir) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let fileData = await tryReadFile(targetPath);

  if (!fileData) {
    const standaloneUploadsDir = path.resolve(process.cwd(), ".next", "standalone", "public", "uploads");
    const standaloneTarget = path.resolve(standaloneUploadsDir, relativePath);
    if (standaloneTarget.startsWith(`${standaloneUploadsDir}${path.sep}`)) {
      fileData = await tryReadFile(standaloneTarget);
    }
  }

  if (!fileData) {
    return new NextResponse("File Not Found", { status: 404 });
  }

  const contentType = getMimeType(relativePath);

  return new NextResponse(fileData.buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileData.info.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
