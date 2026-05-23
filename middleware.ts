import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "kutubi-admin";

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return secret;
}

function hexFromBuffer(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(secret: string, payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return hexFromBuffer(signature);
}

async function verifyAdminSession(token?: string | null) {
  const secret = getSessionSecret();
  if (!secret || !token) return false;

  const parts = token.split(".");
  if (parts.length < 3) return false;

  const signature = parts.pop();
  const expiresAt = Number(parts.pop());
  const email = parts.join(".");

  if (!signature || !email || !Number.isFinite(expiresAt)) return false;
  if (Date.now() > expiresAt) return false;

  const expected = await hmacHex(secret, `${email}.${expiresAt}`);
  return constantTimeEqual(signature, expected);
}

function applySecurityHeaders(res: NextResponse, pathname = "") {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", 'camera=(), microphone=(), geolocation=(), payment=(self "https://www.paypal.com" "https://www.sandbox.paypal.com" "https://checkout.stripe.com")');
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  if (pathname.startsWith("/admin")) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self' https://www.paypal.com https://www.sandbox.paypal.com https://checkout.stripe.com",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' https://www.paypal.com https://www.sandbox.paypal.com",
      "connect-src 'self' https://api-m.paypal.com https://api-m.sandbox.paypal.com https://www.paypal.com https://www.sandbox.paypal.com https://api.stripe.com https://checkout.stripe.com https://api.resend.com",
      "frame-src https://www.paypal.com https://www.sandbox.paypal.com https://*.paypal.com https://checkout.stripe.com"
    ].join('; ');
    res.headers.set('Content-Security-Policy', csp);
  }

  return res;
}

function isStaticAsset(pathname: string) {
  return pathname.startsWith('/_next/') || pathname === '/favicon.ico' || pathname === '/robots.txt' || pathname === '/sitemap.xml' || /\.(?:css|js|map|png|jpg|jpeg|gif|webp|svg|ico)$/.test(pathname);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');
  const isLoginPath = pathname === '/admin/login' || pathname === '/api/admin/login' || pathname.startsWith('/api/admin/login/');
  const isLogoutPath = pathname === '/api/admin/logout';

  const redirectIfHttpsNeeded = () => {
    if (process.env.NODE_ENV !== 'production') return null;
    const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
    if (proto === 'http' && !host.includes('localhost') && !host.startsWith('127.0.0.1')) {
      const url = req.nextUrl.clone();
      url.protocol = 'https:';
      return applySecurityHeaders(NextResponse.redirect(url, 308), pathname);
    }
    return null;
  };

  if (isStaticAsset(pathname)) return applySecurityHeaders(NextResponse.next(), pathname);

  const httpsRedirect = redirectIfHttpsNeeded();
  if (httpsRedirect) return httpsRedirect;

  if (!isAdminPage && !isAdminApi) return applySecurityHeaders(NextResponse.next(), pathname);
  if (isLoginPath || isLogoutPath) return applySecurityHeaders(NextResponse.next(), pathname);

  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const ok = await verifyAdminSession(token);
  if (ok) return applySecurityHeaders(NextResponse.next(), pathname);

  if (isAdminApi) {
    return applySecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), pathname);
  }

  const loginUrl = new URL('/admin/login', req.url);
  return applySecurityHeaders(NextResponse.redirect(loginUrl), pathname);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)']
};
