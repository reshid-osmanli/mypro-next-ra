import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";
import { auth } from "@/auth";
import { findActiveAdminByEmail } from "@/lib/admin-credentials";
import { rejectUntrustedOrigin } from "@/lib/request-security";

export const ADMIN_COOKIE_NAME = "kutubi-admin";
export const ADMIN_LOGIN_CHALLENGE_COOKIE = "kutubi-admin-login";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;
const LOGIN_CHALLENGE_TTL_SECONDS = 10 * 60;
const LOGIN_CODE_LENGTH = 8;

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET is missing or too short");
  }
  return secret;
}

function hmacHex(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function signPayload(payload: string, secret: string) {
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${hmacHex(secret, payload)}`;
}

function verifySignedPayload(token: string, secret: string) {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const expected = hmacHex(secret, payload);
  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return payload;
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}


export function createAdminLoginCode() {
  return String(randomInt(0, 10 ** LOGIN_CODE_LENGTH)).padStart(LOGIN_CODE_LENGTH, "0");
}

export function hashAdminLoginCode(code: string, email: string, expiresAt: number) {
  return createHash("sha256").update(`${code}.${email}.${expiresAt}`).digest("hex");
}

export type AdminLoginChallenge = {
  email: string;
  codeHash: string;
  expiresAt: number;
  issuedAt: number;
};

export function issueAdminLoginChallenge(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const issuedAt = Date.now();
  const expiresAt = issuedAt + LOGIN_CHALLENGE_TTL_SECONDS * 1000;
  const code = createAdminLoginCode();
  const challenge: AdminLoginChallenge = {
    email: normalizedEmail,
    codeHash: hashAdminLoginCode(code, normalizedEmail, expiresAt),
    expiresAt,
    issuedAt
  };
  const token = signPayload(JSON.stringify(challenge), getSessionSecret());
  return { code, challenge, token };
}

export function readAdminLoginChallenge(token?: string | null) {
  if (!token) return null;
  const payload = verifySignedPayload(token, getSessionSecret());
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload) as AdminLoginChallenge;
    if (!parsed || typeof parsed.email !== "string" || typeof parsed.codeHash !== "string") return null;
    if (!Number.isFinite(parsed.expiresAt) || !Number.isFinite(parsed.issuedAt)) return null;
    if (Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function signAdminSession(email: string, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const payload = `${email}.${expiresAt}`;
  const signature = hmacHex(getSessionSecret(), payload);
  return `${payload}.${signature}`;
}

export function readAdminSession(token?: string | null) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length < 3) return false;

  const signature = parts.pop();
  const expiresAt = Number(parts.pop());
  const email = parts.join(".");

  if (!signature || !email || !Number.isFinite(expiresAt)) return false;
  if (Date.now() > expiresAt) return false;

  const expected = hmacHex(getSessionSecret(), `${email}.${expiresAt}`);
  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    if (!timingSafeEqual(a, b)) return false;
    return { email, expiresAt };
  } catch {
    return false;
  }
}

export async function verifyAdminSession(token?: string | null) {
  return Boolean(readAdminSession(token));
}

export async function setAdminCookie(res: NextResponse, email: string) {
  res.cookies.set(ADMIN_COOKIE_NAME, signAdminSession(email), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEFAULT_TTL_SECONDS
  });
}

export function clearAdminCookie(res: NextResponse) {
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export function setAdminLoginChallengeCookie(res: NextResponse, token: string) {
  res.cookies.set(ADMIN_LOGIN_CHALLENGE_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LOGIN_CHALLENGE_TTL_SECONDS
  });
}

export function clearAdminLoginChallengeCookie(res: NextResponse) {
  res.cookies.set(ADMIN_LOGIN_CHALLENGE_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function isAdminRequest(req: NextRequest) {
  if (await isCurrentAuthAdmin()) return true;
  const adminSession = readAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  return Boolean(adminSession && (await isAdminEmail(adminSession.email)));
}

export async function requireAdminRequest(req: NextRequest) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const adminSession = readAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  const ok = (await isCurrentAuthAdmin()) || Boolean(adminSession && (await isAdminEmail(adminSession.email)));
  if (ok) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

function configuredAdminEmails() {
  const values = [process.env.ADMIN_EMAIL, process.env.ADMIN_EMAILS]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => normalizeEmail(value))
    .filter(Boolean) as string[];

  return new Set(values);
}

export async function getCurrentAuthEmail() {
  const session = await auth();
  return normalizeEmail(session?.user?.email);
}

export async function isAdminEmail(email?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  if (configuredAdminEmails().has(normalizedEmail)) return true;

  const admin = await findActiveAdminByEmail(normalizedEmail);
  return Boolean(admin?.active);
}

export async function isCurrentAuthAdmin() {
  const email = await getCurrentAuthEmail();
  return isAdminEmail(email);
}

export async function requireAdminSession() {
  const email = await getCurrentAuthEmail();
  if (email && (await isAdminEmail(email))) return { email };

  const cookieStore = await cookies();
  const adminSession = readAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  if (!adminSession || !(await isAdminEmail(adminSession.email))) return null;

  return { email: adminSession.email };
}
