import { NextResponse } from "next/server";
import { resolveSiteOrigin } from "@/lib/site-url";

function sameOrigin(urlA: string, urlB: string) {
  try {
    return new URL(urlA).origin === new URL(urlB).origin;
  } catch {
    return false;
  }
}

function isLocalOrigin(origin: string | null) {
  return !!origin && /^(http:\/\/localhost:\d+|http:\/\/127\.0\.0\.1:\d+)$/.test(origin);
}

export function isTrustedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const fetchSite = req.headers.get("sec-fetch-site");
  const requestUrl = req.url;
  const configuredOrigin = resolveSiteOrigin();
  const requestHost = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0]?.trim();

  if (fetchSite && !["same-origin", "same-site"].includes(fetchSite)) {
    return false;
  }

  if (fetchSite && ["same-origin", "same-site"].includes(fetchSite) && !origin && !referer) {
    return true;
  }

  function matchesRequestHost(value: string) {
    if (!requestHost) return false;
    try {
      return new URL(value).host === requestHost;
    } catch {
      return false;
    }
  }

  if (origin) {
    if (sameOrigin(origin, requestUrl)) return true;
    if (configuredOrigin && sameOrigin(origin, configuredOrigin)) return true;
    if (matchesRequestHost(origin)) return true;
    if (isLocalOrigin(origin) && isLocalOrigin(new URL(requestUrl).origin)) return true;
    return false;
  }

  if (referer) {
    if (sameOrigin(referer, requestUrl)) return true;
    if (configuredOrigin && sameOrigin(referer, configuredOrigin)) return true;
    if (matchesRequestHost(referer)) return true;
    if (isLocalOrigin(referer) && isLocalOrigin(new URL(requestUrl).origin)) return true;
    return false;
  }

  return false;
}

export function rejectUntrustedOrigin(req: Request) {
  if (isTrustedOrigin(req)) return null;
  return NextResponse.json({ error: "طلب غير مسموح" }, { status: 403 });
}
