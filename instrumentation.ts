import { inferAreaFromRoute } from "@/lib/report-caught-error";

function reasonMessage(reason: unknown) {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  try {
    return JSON.stringify(reason);
  } catch {
    return "Unhandled rejection";
  }
}

function reasonStack(reason: unknown) {
  return reason instanceof Error ? reason.stack : undefined;
}

export async function register() {
  // Telegram alerting removed. Keep registration API for future integrations.
  return;
}

export async function onRequestError(
  error: Error & { digest?: string },
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string | string[] | undefined };
  },
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
  }
) {
  const userAgent = typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : undefined;

  const route = context.routePath || request.path;
  const area = inferAreaFromRoute(route);

  // Log server errors instead of sending Telegram alerts.
  console.error(`[${area ?? "unknown"}] Server request error:`, error, {
    route,
    method: request.method,
    userAgent,
    routerKind: context.routerKind,
    routeType: context.routeType,
    path: request.path
  });
}
