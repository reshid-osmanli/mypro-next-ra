import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { sendTelegramAlert } from "@/lib/telegram-alerts";

const schema = z.object({
  source: z.enum(["client", "react", "fetch"]),
  level: z.enum(["error", "warn"]).optional().default("error"),
  message: z.string().trim().min(1).max(4000),
  stack: z.string().max(8000).optional(),
  url: z.string().max(800).optional(),
  route: z.string().max(400).optional(),
  status: z.number().int().min(100).max(599).optional(),
  component: z.string().max(200).optional(),
  digest: z.string().max(120).optional()
});

export async function POST(req: Request) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const ip = getRequestIp(req);
  if (isRateLimited(`telegram-report:${ip}`, 40, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const userAgent = req.headers.get("user-agent") ?? undefined;
  const sent = await sendTelegramAlert({
    source: parsed.data.source,
    level: parsed.data.level,
    message: parsed.data.message,
    stack: parsed.data.stack,
    url: parsed.data.url,
    route: parsed.data.route ?? parsed.data.component,
    statusCode: parsed.data.status,
    userAgent,
    digest: parsed.data.digest,
    extra: parsed.data.component ? { component: parsed.data.component } : undefined
  });

  return NextResponse.json({ ok: sent });
}
