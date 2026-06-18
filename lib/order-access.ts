import { createHash, randomBytes } from "crypto";

export const DOWNLOAD_SESSION_COOKIE = "kutubi-download-session";
export const CLAIM_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const DOWNLOAD_SESSION_TTL_MS = 20 * 60 * 1000; // 20 minutes to issue links

export function createSecureToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
