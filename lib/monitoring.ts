// ============================================================================
// lib/monitoring.ts — Sentry helpers for server-side error capture
// ----------------------------------------------------------------------------
// New file: /lib/monitoring.ts
// Replace `lib/report-caught-error.ts` with this Sentry-backed version.
// ============================================================================

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN?.trim();
const SENTRY_ENV = process.env.SENTRY_ENV?.trim() ?? process.env.NODE_ENV;
const SENTRY_RELEASE = process.env.SENTRY_RELEASE?.trim();
const SENTRY_TRACES_SAMPLE_RATE = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1");
const SENTRY_PROFILES_SAMPLE_RATE = Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? "0");

export function initSentry() {
  if (!SENTRY_DSN) return;
  if (Sentry.getCurrentHub().getClient()) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENV,
    release: SENTRY_RELEASE,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    profilesSampleRate: SENTRY_PROFILES_SAMPLE_RATE,
    enabled: process.env.NODE_ENV === "production",
    beforeSend(event, hint) {
      // Drop noisy events
      const err = hint?.originalException;
      if (err && typeof err === "object" && "code" in err) {
        const code = String((err as { code: unknown }).code);
        if (code === "P2002" || code === "P2025") return null;
      }
      // Strip sensitive data
      if (event.request?.cookies) {
        event.request.cookies = {};
      }
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
        delete event.request.headers["x-csrf-token"];
      }
      return event;
    },
    ignoreErrors: [
      /^NetworkError/,
      /^Failed to fetch$/,
      /AbortError/,
    ],
  });
}

export type RouteContext = {
  pathname: string;
  method?: string;
  ip?: string;
  email?: string;
};

export async function reportCaughtError(
  error: unknown,
  context: RouteContext & Record<string, unknown>
): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.error("[error]", error, context);
    return;
  }
  Sentry.withScope((scope) => {
    scope.setTag("pathname", context.pathname);
    if (context.method) scope.setTag("method", context.method);
    if (context.ip) scope.setUser({ ip_address: context.ip });
    Object.entries(context).forEach(([key, value]) => {
      if (key === "pathname" || key === "method" || key === "ip") return;
      scope.setExtra(key, value);
    });
    Sentry.captureException(error);
  });
}

export async function reportApiFailure(
  req: Request,
  message: string,
  details?: { statusCode?: number; area?: string }
): Promise<void> {
  const url = new URL(req.url);
  await reportCaughtError(new Error(message), {
    pathname: url.pathname,
    method: req.method,
    ...details,
  });
}

export function routeContext(req: Request, area = "api"): RouteContext {
  const url = new URL(req.url);
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined;
  return { pathname: url.pathname, method: req.method, ip, area };
}
