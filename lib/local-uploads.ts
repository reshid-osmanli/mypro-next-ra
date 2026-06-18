import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import type { UploadPolicy } from "./upload-policy";

type LocalUploadParams = {
  bytes: Buffer;
  fileName: string;
  policy: UploadPolicy;
};

function safeStoredFileName(fileName: string) {
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

function resolveUploadTarget(policy: UploadPolicy, fileName: string) {
  const directory = policy.private ? path.join(process.cwd(), "storage", "uploads") : path.join(process.cwd(), "public", "uploads");
  const safeName = safeStoredFileName(fileName);
  const targetPath = path.resolve(directory, safeName);
  const root = path.resolve(directory);

  if (!targetPath.startsWith(`${root}${path.sep}`)) {
    throw new Error("Unsafe upload path");
  }

  return {
    directory,
    targetPath,
    publicId: safeName,
    url: `${policy.private ? "/private-uploads" : "/uploads"}/${safeName}`
  };
}

export async function saveUploadToLocalStorage({ bytes, fileName, policy }: LocalUploadParams) {
  const target = resolveUploadTarget(policy, fileName);
  await mkdir(target.directory, { recursive: true });
  await writeFile(target.targetPath, bytes, { flag: "wx" });

  return {
    secureUrl: target.url,
    publicId: target.publicId,
    resourceType: policy.private ? "raw" : "image",
    bytes: bytes.length,
    originalFilename: fileName
  };
}
