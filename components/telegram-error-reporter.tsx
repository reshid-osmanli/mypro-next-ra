"use client";

import { useEffect } from "react";

type ReportPayload = {
  source: "client" | "react" | "fetch";
  level?: "error" | "warn";
  message: string;
  stack?: string;
  url?: string;
  route?: string;
  status?: number;
  component?: string;
  digest?: string;
};

const reported = new Set<string>();

function fingerprint(payload: ReportPayload) {
  return [payload.source, payload.message, payload.url ?? "", payload.route ?? "", String(payload.status ?? "")].join("|");
}

async function reportToServer(payload: ReportPayload) {
  const key = fingerprint(payload);
  if (reported.has(key)) return;
  reported.add(key);
  if (reported.size > 200) reported.clear();

  try {
    await fetch("/api/alerts/report", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        url: payload.url ?? (typeof window !== "undefined" ? window.location.href : undefined)
      })
    });
  } catch {
    // Avoid recursive reporting loops.
  }
}

function messageFromReason(reason: unknown) {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  try {
    return JSON.stringify(reason);
  } catch {
    return "Unhandled rejection";
  }
}

function stackFromReason(reason: unknown) {
  return reason instanceof Error ? reason.stack : undefined;
}

export function TelegramErrorReporter() {
  useEffect(() => {
    const pageUrl = () => window.location.href;

    const onError = (event: ErrorEvent) => {
      void reportToServer({
        source: "client",
        message: event.message || "Unknown client error",
        stack: event.error instanceof Error ? event.error.stack : undefined,
        url: pageUrl(),
        component: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      void reportToServer({
        source: "client",
        message: messageFromReason(event.reason),
        stack: stackFromReason(event.reason),
        url: pageUrl()
      });
    };

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      try {
        const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        const parsed = new URL(requestUrl, window.location.origin);
        const sameOrigin = parsed.origin === window.location.origin;
        const isApi = parsed.pathname.startsWith("/api/");
        if (parsed.pathname === "/api/alerts/report") return response;
        if (sameOrigin && isApi && response.status >= 400) {
          const isAdminPage = window.location.pathname.startsWith("/admin");
          const area = parsed.pathname.startsWith("/api/admin") || isAdminPage ? "admin" : undefined;
          let detail = "";
          try {
            const clone = response.clone();
            const json = (await clone.json()) as { error?: string };
            detail = json?.error ? `: ${json.error}` : "";
          } catch {
            detail = "";
          }
          void reportToServer({
            source: "fetch",
            level: response.status >= 500 ? "error" : "warn",
            message: `${area === "admin" ? "[admin] " : ""}طلب API فشل (${response.status})${detail}`,
            route: parsed.pathname,
            status: response.status,
            url: pageUrl(),
            method: init?.method ?? "GET",
            component: area
          });
        }
      } catch {
        // Ignore monitoring failures.
      }
      return response;
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}

export async function reportReactError(error: Error & { digest?: string }, component?: string) {
  await reportToServer({
    source: "react",
    message: error.message || "React render error",
    stack: error.stack,
    digest: error.digest,
    component,
    url: typeof window !== "undefined" ? window.location.href : undefined
  });
}
