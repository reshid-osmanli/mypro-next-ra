type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendSecurityEmail(message: EmailMessage) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

  if (!resendApiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email provider is not configured");
    }
    console.warn("[mail:dev]", { to: message.to, subject: message.subject, text: message.text, appUrl });
    return { ok: true, dev: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html ?? `<pre style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;white-space:pre-wrap">${escapeHtml(message.text)}</pre>`
    })
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to send email: ${res.status} ${errorText}`);
  }

  return res.json() as Promise<{ id: string }>;
}

export function buildAdminOtpEmail(params: { code: string; expiresMinutes: number }) {
  const subject = "رمز التحقق الخاص بلوحة الإدارة";
  const text = [
    `مرحبًا،`,
    ``,
    `رمز التحقق الخاص بتسجيل الدخول (8 أرقام) هو: ${params.code}`,
    ``,
    `ينتهي الرمز خلال ${params.expiresMinutes} دقيقة.`,
    `إذا لم تطلب هذا الرمز، تجاهل الرسالة فورًا.`
  ].join("\n");

  const html = `
    <div dir="rtl" style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;line-height:1.8;color:#111827">
      <h2 style="margin:0 0 12px">رمز التحقق الخاص بلوحة الإدارة</h2>
      <p style="margin:0 0 12px">رمز التحقق الخاص بتسجيل الدخول (8 أرقام) هو:</p>
      <div style="display:inline-block;padding:12px 18px;border:1px solid #e5e7eb;border-radius:14px;font-size:28px;font-weight:800;letter-spacing:4px;background:#f9fafb">${escapeHtml(params.code)}</div>
      <p style="margin:16px 0 0">ينتهي الرمز خلال ${params.expiresMinutes} دقيقة.</p>
      <p style="margin:8px 0 0;color:#6b7280">إذا لم تطلب هذا الرمز، تجاهل الرسالة فورًا.</p>
    </div>
  `;

  return { subject, text, html };
}
