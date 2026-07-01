// ============================================================================
// middleware-i18n.ts — Replace existing middleware with locale-aware version
// ----------------------------------------------------------------------------
// New file: /middleware.ts (replaces existing middleware)
// Combines next-intl locale routing with our security/CSRF middleware
// ============================================================================

import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale } from "@/i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeDetection: true,
});

const CSRF_COOKIE = "kutubi_csrf";

export default function middleware(req: NextRequest) {
  // First: locale handling
  const intlResponse = intlMiddleware(req);
  if (intlResponse.headers.get("x-middleware-rewrite") || intlResponse.headers.get("Location")) {
    return intlResponse;
  }

  // Second: security headers on the response
  const res = intlResponse;
  const pathname = req.nextUrl.pathname;

  // Existing security logic here (omitted for brevity - copy from middleware.ts)
  // ... [paste the security/CSRF logic from your current middleware.ts here] ...

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api).*)"],
};
