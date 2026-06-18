import { randomBytes, createHash } from "crypto";

export const DOWNLOAD_SESSION_COOKIE = "kutubi-download-session";
export const DOWNLOAD_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function createSecureToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
