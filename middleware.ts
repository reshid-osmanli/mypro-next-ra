import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const AFFILIATE_COOKIE = "kutubi_ref";

const { auth: authMiddleware } = NextAuth(authConfig);

// ---------------------------------------------------------------------------
// next-intl locale detection (without URL prefix rewriting)
// ---------------------------------------------------------------------------
export async function localeMiddleware(req: NextRequest, res: NextResponse) {
  const localeCookie = req.cookies.get("NEXT_LOCALE")?.value;
  const acceptLang = req.headers.get("accept-language") || "";
  let locale = localeCookie || "ar";

  if (!localeCookie && acceptLang) {
    const match = acceptLang.match(/ar/i) ? "ar" : acceptLang.match(/en/i) ? "en" : null;
    if (match) locale = match;
  }

  res.headers.set("x-locale-detected", locale);

  res.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production"
  });

  return res;
}

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
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
      "form-action 'self' https://www.paypal.com https://www.sandbox.paypal.com https://checkout.stripe.com https://accounts.google.com https://*.google.com",
      "object-src 'none'",
      "img-src 'self' data: blob: https: https://*.paypal.com https://*.paypalobjects.com https://*.googleusercontent.com https://res.cloudinary.com",
      "media-src 'self' data: blob: https: https://res.cloudinary.com",
      "font-src 'self' data: https: https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://*.paypal.com https://*.paypalobjects.com https://fonts.googleapis.com",
      "script-src 'self' 'unsafe-inline' https://*.paypal.com https://*.paypalobjects.com https://accounts.google.com https://*.googleapis.com https://*.gstatic.com",
      "connect-src 'self' https://*.paypal.com https://*.paypalobjects.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://api.stripe.com https://checkout.stripe.com https://api.resend.com https://*.googleapis.com https://*.google.com https://api.cloudinary.com",
      "child-src https://*.paypal.com https://*.paypalobjects.com https://accounts.google.com",
      "frame-src https://*.paypal.com https://*.paypalobjects.com https://checkout.stripe.com https://accounts.google.com"
    ].join("; ");
    res.headers.set("Content-Security-Policy", csp);
  }

  return res;
}

function sanitizeReferralCode(code: string | null) {
  return code?.trim().toUpperCase().replace(/[^A-Z0-9_\-]/g, "").slice(0, 32) || "";
}

function withReferralCookie(req: NextRequest, res: NextResponse) {
  const code = sanitizeReferralCode(req.nextUrl.searchParams.get("ref"));
  if (code) {
    res.cookies.set(AFFILIATE_COOKIE, code, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30
    });
  }
  return res;
}

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/uploads/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(?:css|js|map|png|jpg|jpeg|gif|webp|svg|ico|mp4|webm|mov|pdf|woff|woff2)$/.test(pathname)
  );
}

function redirectIfHttpsNeeded(req: NextRequest, pathname: string) {
  if (process.env.NODE_ENV !== "production") return null;
  const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  if (proto === "http" && !host.includes("localhost") && !host.startsWith("127.0.0.1")) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return applySecurityHeaders(NextResponse.redirect(url, 308), pathname);
  }
  return null;
}

function loginRedirect(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);
  const callbackUrl = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  loginUrl.searchParams.set("callbackUrl", callbackUrl || "/");
  return loginUrl;
}

function isProtectedPage(pathname: string) {
  return pathname.startsWith("/purchases");
}

function isProtectedApi(pathname: string) {
  return (
    pathname === "/api/purchases" ||
    pathname === "/api/purchases/drive/start" ||
    pathname === "/api/purchases/drive/sync"
  );
}

export default authMiddleware((req) => {
  const { pathname } = req.nextUrl;

  if (isStaticAsset(pathname)) {
    const res = NextResponse.next();
    return applySecurityHeaders(res, pathname);
  }

  const httpsRedirect = redirectIfHttpsNeeded(req, pathname);
  if (httpsRedirect) return httpsRedirect;

  if (pathname.startsWith("/api/auth") || pathname === "/login" || pathname === "/signup") {
    const res = NextResponse.next();
    applySecurityHeaders(res, pathname);
    return localeMiddleware(req, res);
  }

  if (pathname === "/api/purchases/drive/callback") {
    const res = NextResponse.next();
    return applySecurityHeaders(res, pathname);
  }

  if ((isProtectedPage(pathname) || isProtectedApi(pathname)) && !req.auth?.user?.email) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return applySecurityHeaders(res, pathname);
    }
    return applySecurityHeaders(NextResponse.redirect(loginRedirect(req)), pathname);
  }

  const res = NextResponse.next();
  applySecurityHeaders(res, pathname);
  withReferralCookie(req, res);
  localeMiddleware(req, res);
  return res;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
