export type AppArea = "storefront" | "admin" | "payments" | "orders" | "purchases" | "auth" | "system";

export type ErrorReportContext = {
  route: string;
  method?: string;
  area?: AppArea;
  statusCode?: number;
  level?: "error" | "warn";
  extra?: Record<string, unknown>;
};

export function inferAreaFromRoute(route: string): AppArea | undefined {
  if (route.startsWith("/api/admin") || route.startsWith("/admin")) return "admin";
  if (route.startsWith("/api/paypal") || route.startsWith("/api/checkout") || route.startsWith("/api/stripe")) return "payments";
  if (route.startsWith("/api/order")) return "orders";
  if (route.startsWith("/api/purchases")) return "purchases";
  if (route.startsWith("/api/auth")) return "auth";
  if (route.startsWith("/api/")) return "system";
  return "storefront";
}

export function routeContext(req: Request, area?: AppArea): ErrorReportContext {
  const route = new URL(req.url).pathname;
  return {
    route,
    method: req.method,
    area: area ?? inferAreaFromRoute(route)
  };
}

function prefixArea(area: AppArea | undefined, message: string) {
  return area ? `[${area}] ${message}` : message;
}

export async function reportCaughtError(error: unknown, context: ErrorReportContext) {
  const message = error instanceof Error ? error.message : String(error);
  // Telegram alerts removed: fallback to logging for server-side error reports
  console.error("[reportCaughtError]", prefixArea(context.area, message), {
    stack: error instanceof Error ? (error as Error).stack : undefined,
    route: context.route,
    method: context.method,
    statusCode: context.statusCode,
    extra: context.extra
  });
}

export async function reportApiFailure(req: Request, publicMessage: string, options?: { statusCode?: number; error?: unknown; area?: AppArea; level?: "error" | "warn" }) {
  const ctx = routeContext(req, options?.area);
  if (options?.error) {
    await reportCaughtError(options.error, { ...ctx, statusCode: options.statusCode ?? 500, level: options.level });
    return;
  }

  console.error("[reportApiFailure]", prefixArea(ctx.area, publicMessage), {
    route: ctx.route,
    method: ctx.method,
    statusCode: options?.statusCode ?? 500
  });
}
