import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

export const PURCHASE_SESSION_COOKIE = "kutubi-purchase-session";
export const PURCHASE_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
export const PURCHASE_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "kutubi-dev-session-secret";
}

function base64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function hmac(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function constantTimeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function normalizePurchaseEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createPurchaseAccessToken() {
  return randomBytes(32).toString("hex");
}

export function hashPurchaseToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function signPurchaseSession(email: string, ttlSeconds = PURCHASE_SESSION_TTL_SECONDS) {
  const normalizedEmail = normalizePurchaseEmail(email);
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${base64Url(normalizedEmail)}.${expiresAt}`;
  return `${payload}.${hmac(payload)}`;
}

export function verifyPurchaseSession(token?: string | null) {
  if (!token) return null;
  const [emailPart, expiresAtPart, signature] = token.split(".");
  const expiresAt = Number(expiresAtPart);
  if (!emailPart || !signature || !Number.isFinite(expiresAt)) return null;
  if (expiresAt < Math.floor(Date.now() / 1000)) return null;

  const payload = `${emailPart}.${expiresAtPart}`;
  if (!constantTimeEqual(signature, hmac(payload))) return null;

  try {
    return normalizePurchaseEmail(fromBase64Url(emailPart));
  } catch {
    return null;
  }
}
