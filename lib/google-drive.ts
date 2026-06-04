import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { attachmentHeader } from "./stored-files";
import { resolveSiteUrl } from "./site-url";

type GoogleConfig = {
  clientId: string;
  clientSecret: string;
  siteUrl: string;
  redirectUri: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_FOLDER_NAME = "Kutubi Purchases";

function getStateSecret() {
  return process.env.ADMIN_SESSION_SECRET || "kutubi-dev-session-secret";
}

function getEncryptionSecret() {
  return process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || process.env.ADMIN_SESSION_SECRET || "kutubi-dev-token-secret";
}

function encryptionKey() {
  return createHash("sha256").update(getEncryptionSecret()).digest();
}

function hmac(value: string) {
  return createHmac("sha256", getStateSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function getGoogleDriveConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const siteUrl = resolveSiteUrl();
  if (!clientId || !clientSecret || !siteUrl) return null;

  return {
    clientId,
    clientSecret,
    siteUrl,
    redirectUri: `${siteUrl.replace(/\/$/, "")}/api/purchases/drive/callback`
  } satisfies GoogleConfig;
}

export function encryptRefreshToken(refreshToken: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(refreshToken, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${tag.toString("hex")}.${encrypted.toString("hex")}`;
}

export function decryptRefreshToken(payload: string) {
  const [ivHex, tagHex, encryptedHex] = payload.split(".");
  if (!ivHex || !tagHex || !encryptedHex) throw new Error("Invalid encrypted Google token");

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]).toString("utf8");
}

export function signGoogleOAuthState(email: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60;
  const nonce = randomBytes(16).toString("hex");
  const payload = Buffer.from(JSON.stringify({ email, expiresAt, nonce }), "utf8").toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

export function verifyGoogleOAuthState(state?: string | null) {
  if (!state) return null;
  const [payload, signature] = state.split(".");
  if (!payload || !signature || !safeEqual(signature, hmac(payload))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: string; expiresAt?: number };
    if (!parsed.email || !parsed.expiresAt || parsed.expiresAt < Math.floor(Date.now() / 1000)) return null;
    return parsed.email.trim().toLowerCase();
  } catch {
    return null;
  }
}

export function buildGoogleDriveAuthUrl(email: string) {
  const config = getGoogleDriveConfig();
  if (!config) {
    throw new Error("Google Drive is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", DRIVE_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", signGoogleOAuthState(email));
  return url;
}

async function readGoogleError(res: Response) {
  const data = (await res.json().catch(() => null)) as GoogleTokenResponse | null;
  return data?.error_description || data?.error || `${res.status} ${res.statusText}`;
}

export async function exchangeGoogleCode(code: string) {
  const config = getGoogleDriveConfig();
  if (!config) {
    throw new Error("Google Drive is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri
    })
  });

  const data = (await res.json().catch(() => ({}))) as GoogleTokenResponse;
  if (!res.ok || !data.refresh_token) {
    throw new Error(`Google authorization failed: ${data.error_description || data.error || res.statusText}`);
  }

  return data;
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const config = getGoogleDriveConfig();
  if (!config) {
    throw new Error("Google Drive is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });

  const data = (await res.json().catch(() => ({}))) as GoogleTokenResponse;
  if (!res.ok || !data.access_token) {
    throw new Error(`Unable to refresh Google Drive access: ${data.error_description || data.error || res.statusText}`);
  }

  return data.access_token;
}

async function googleDriveJson<T>(url: string, accessToken: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!res.ok) {
    throw new Error(`Google Drive request failed: ${await readGoogleError(res)}`);
  }

  return res.json() as Promise<T>;
}

export async function ensureKutubiDriveFolder(accessToken: string) {
  const query = [
    `name='${DRIVE_FOLDER_NAME.replace(/'/g, "\\'")}'`,
    "mimeType='application/vnd.google-apps.folder'",
    "trashed=false"
  ].join(" and ");
  const listUrl = new URL("https://www.googleapis.com/drive/v3/files");
  listUrl.searchParams.set("q", query);
  listUrl.searchParams.set("spaces", "drive");
  listUrl.searchParams.set("fields", "files(id,name)");

  const existing = await googleDriveJson<{ files?: Array<{ id: string; name: string }> }>(listUrl.toString(), accessToken);
  const existingId = existing.files?.[0]?.id;
  if (existingId) return existingId;

  const created = await googleDriveJson<{ id: string }>("https://www.googleapis.com/drive/v3/files?fields=id", accessToken, {
    method: "POST",
    body: JSON.stringify({
      name: DRIVE_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder"
    })
  });

  return created.id;
}

export async function uploadBufferToDrive(params: {
  accessToken: string;
  folderId: string;
  name: string;
  mimeType: string;
  data: Buffer;
}) {
  const boundary = `kutubi_${randomUUID()}`;
  const metadata = {
    name: params.name,
    mimeType: params.mimeType,
    parents: [params.folderId]
  };
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${params.mimeType}\r\nContent-Disposition: ${attachmentHeader(params.name)}\r\n\r\n`),
    params.data,
    Buffer.from(`\r\n--${boundary}--`)
  ]);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": String(body.length)
    },
    body
  });

  if (!res.ok) {
    throw new Error(`Google Drive upload failed: ${await readGoogleError(res)}`);
  }

  return res.json() as Promise<{ id: string; name: string }>;
}
