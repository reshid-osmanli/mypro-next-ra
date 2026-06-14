import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth: authMiddleware } = NextAuth(authConfig);

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
      "img-src 'self' data: blob: https: https://*.paypal.com https://*.paypalobjects.com",
      "style-src 'self' 'unsafe-inline' https://*.paypal.com https://*.paypalobjects.com",
      "script-src 'self' 'unsafe-inline' https://*.paypal.com https://*.paypalobjects.com",
      "connect-src 'self' https://*.paypal.com https://*.paypalobjects.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://api.stripe.com https://checkout.stripe.com https://api.resend.com",
      "child-src https://*.paypal.com https://*.paypalobjects.com",
      "frame-src https://*.paypal.com https://*.paypalobjects.com https://checkout.stripe.com"
    ].join("; ");
    res.headers.set("Content-Security-Policy", csp);
  }

  return res;
}

function isStaticAsset(pathname: string) {
  return pathname.startsWith("/_next/") || pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml" || /\.(?:css|js|map|png|jpg|jpeg|gif|webp|svg|ico)$/.test(pathname);
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
  // Public storefront/library pages stay open. Only personal purchase pages require login here.
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

  if (isStaticAsset(pathname)) return applySecurityHeaders(NextResponse.next(), pathname);

  const httpsRedirect = redirectIfHttpsNeeded(req, pathname);
  if (httpsRedirect) return httpsRedirect;

  if (pathname.startsWith("/api/auth") || pathname === "/login" || pathname === "/signup") {
    return applySecurityHeaders(NextResponse.next(), pathname);
  }

  if (pathname === "/api/purchases/drive/callback") {
    return applySecurityHeaders(NextResponse.next(), pathname);
  }

  if ((isProtectedPage(pathname) || isProtectedApi(pathname)) && !req.auth?.user?.email) {
    if (pathname.startsWith("/api/")) {
      return applySecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), pathname);
    }

    return applySecurityHeaders(NextResponse.redirect(loginRedirect(req)), pathname);
  }

  return applySecurityHeaders(NextResponse.next(), pathname);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
