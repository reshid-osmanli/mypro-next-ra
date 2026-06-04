import { sendTelegramAlert } from "@/lib/telegram-alerts";
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
  if (typeof process === "undefined") return;

  process.on("unhandledRejection", (reason) => {
    void sendTelegramAlert({
      source: "process",
      message: reasonMessage(reason),
      stack: reasonStack(reason),
      extra: { kind: "unhandledRejection" }
    });
  });

  process.on("uncaughtException", (error) => {
    void sendTelegramAlert({
      source: "process",
      message: error.message,
      stack: error.stack,
      extra: { kind: "uncaughtException" }
    });
  });
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

  await sendTelegramAlert({
    source: "server",
    message: area ? `[${area}] ${error.message || "Server request error"}` : error.message || "Server request error",
    stack: error.stack,
    digest: error.digest,
    route,
    method: request.method,
    userAgent,
    extra: {
      routerKind: context.routerKind,
      routeType: context.routeType,
      path: request.path
    }
  });
}
