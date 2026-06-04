export type TelegramAlertInput = {
  source: "client" | "server" | "react" | "fetch" | "process";
  level?: "error" | "warn";
  message: string;
  stack?: string;
  url?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string;
  digest?: string;
  extra?: Record<string, unknown>;
};

const TELEGRAM_TEXT_LIMIT = 4090;

function alertsConfigured() {
  const enabled = process.env.TELEGRAM_ALERTS_ENABLED !== "false";
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  return enabled && Boolean(token && chatId);
}

function allowInThisRuntime() {
  if (process.env.NODE_ENV !== "production" && process.env.TELEGRAM_ALERTS_IN_DEV !== "true") {
    return false;
  }
  return true;
}

function dedupeKey(input: TelegramAlertInput) {
  return [input.source, input.level ?? "error", input.route ?? "", input.url ?? "", input.message.slice(0, 240)].join("|");
}

function dedupeStore() {
  const globalRef = globalThis as typeof globalThis & { __kutubiTelegramDedup?: Map<string, number> };
  if (!globalRef.__kutubiTelegramDedup) globalRef.__kutubiTelegramDedup = new Map();
  return globalRef.__kutubiTelegramDedup;
}

function shouldSend(input: TelegramAlertInput, windowMs = 90_000) {
  const key = dedupeKey(input);
  const store = dedupeStore();
  const now = Date.now();
  const last = store.get(key);
  if (last && now - last < windowMs) return false;
  store.set(key, now);
  if (store.size > 500) {
    for (const [entryKey, ts] of store.entries()) {
      if (now - ts > windowMs) store.delete(entryKey);
    }
  }
  return true;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function formatTelegramAlert(input: TelegramAlertInput) {
  const level = input.level ?? "error";
  const lines = [
    `<b>🚨 Kutubi — ${level === "warn" ? "تحذير" : "خطأ"}</b>`,
    `<b>المصدر:</b> ${escapeHtml(input.source)}`,
    input.route ? `<b>المسار:</b> <code>${escapeHtml(input.route)}</code>` : null,
    input.method ? `<b>HTTP:</b> ${escapeHtml(input.method)}` : null,
    input.statusCode != null ? `<b>الحالة:</b> ${input.statusCode}` : null,
    input.url ? `<b>الصفحة:</b> ${escapeHtml(input.url)}` : null,
    input.digest ? `<b>Digest:</b> <code>${escapeHtml(input.digest)}</code>` : null,
    `<b>الرسالة:</b>\n<pre>${escapeHtml(input.message.slice(0, 1800))}</pre>`,
    input.stack ? `<b>Stack:</b>\n<pre>${escapeHtml(input.stack.slice(0, 1600))}</pre>` : null,
    input.userAgent ? `<b>المتصفح:</b> ${escapeHtml(input.userAgent.slice(0, 220))}` : null,
    input.extra && Object.keys(input.extra).length
      ? `<b>تفاصيل:</b>\n<pre>${escapeHtml(JSON.stringify(input.extra, null, 2).slice(0, 900))}</pre>`
      : null,
    `<i>${escapeHtml(new Date().toISOString())}</i>`
  ].filter(Boolean);

  return lines.join("\n").slice(0, TELEGRAM_TEXT_LIMIT);
}

export async function sendTelegramAlert(input: TelegramAlertInput): Promise<boolean> {
  if (!alertsConfigured() || !allowInThisRuntime()) return false;
  if (!shouldSend(input)) return false;

  const token = process.env.TELEGRAM_BOT_TOKEN!.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID!.trim();
  const text = formatTelegramAlert(input);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true
      }),
      cache: "no-store"
    });

    if (!res.ok) {
      console.error("[telegram-alerts] send failed", res.status, await res.text().catch(() => ""));
      return false;
    }

    return true;
  } catch (error) {
    console.error("[telegram-alerts] network error", error);
    return false;
  }
}

export function telegramAlertsReady() {
  return alertsConfigured();
}
