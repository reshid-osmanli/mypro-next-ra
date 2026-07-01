// ============================================================================
// emails/abandoned-cart-template.ts — HTML email builder for abandoned cart
// ----------------------------------------------------------------------------
// New file: /lib/emails/abandoned-cart-template.ts
// ============================================================================

import { currencyLabel } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  coverImage?: string | null;
};

export type CartReminderInput = {
  email: string;
  customerName?: string | null;
  items: Item[];
  subtotal: number;
  couponCode?: string;
  discountPercent?: number;
  resumeUrl: string;
  type: "first" | "second" | "third";
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

export function buildAbandonedCartEmail(input: CartReminderInput) {
  const headline =
    input.type === "first"
      ? "سلتك في انتظارك ✨"
      : input.type === "second"
      ? "عرض خاص لك: خصم ترحيبي"
      : "آخر فرصة! خصم إضافي لك";

  const subject =
    input.type === "first"
      ? `سلتك في ${input.email} تنتظرك لإتمام الشراء`
      : input.type === "second"
      ? `خصم ${input.discountPercent ?? 5}% على سلتك — لا تفوّتها`
      : `آخر فرصة: خصم ${input.discountPercent ?? 10}% ينتهي قريباً`;

  const itemRows = input.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #ede3d1">
            <div style="display:flex;gap:12px;align-items:center">
              ${
                item.coverImage
                  ? `<img src="${escapeHtml(item.coverImage)}" alt="" width="56" height="56" style="border-radius:8px;object-fit:cover" />`
                  : `<div style="width:56px;height:56px;background:#f8f3e9;border-radius:8px"></div>`
              }
              <div>
                <div style="font-weight:700;color:#0f172a">${escapeHtml(item.title)}</div>
                <div style="font-size:12px;color:#64748b">${currencyLabel(item.price)} × ${item.quantity}</div>
              </div>
            </div>
          </td>
        </tr>`
    )
    .join("");

  const couponLine =
    input.couponCode && input.discountPercent
      ? `<div style="margin:16px 0;padding:14px 18px;background:#ecfdf5;border:1px dashed #10b981;border-radius:12px;text-align:center">
           <div style="font-weight:800;color:#047857;margin-bottom:6px">قسيمة خصم ${input.discountPercent}% لك</div>
           <div style="font-family:monospace;font-size:22px;font-weight:900;letter-spacing:2px;color:#0f766e">${escapeHtml(input.couponCode)}</div>
           <div style="font-size:12px;color:#64748b;margin-top:4px">صالح لمدة 14 يوماً</div>
         </div>`
      : "";

  const html = `
    <div dir="rtl" style="font-family:ui-sans-serif,system-ui,'Segoe UI',Roboto,sans-serif;line-height:1.7;color:#111827;max-width:600px;margin:0 auto">
      <div style="background:linear-gradient(135deg,#8a1538 0%,#5f1029 100%);padding:24px;border-radius:16px 16px 0 0">
        <h1 style="margin:0;color:#fff;font-size:24px">${escapeHtml(headline)}</h1>
        <p style="margin:8px 0 0;color:#fce7ef;font-size:14px">
          ${input.customerName ? `أهلاً ${escapeHtml(input.customerName)}،` : "أهلاً بك،"}
          لا زلنا نحتفظ بمنتجاتك المختارة
        </p>
      </div>
      <div style="padding:24px;background:#fff;border:1px solid #ede3d1;border-top:0">
        <table style="width:100%;border-collapse:collapse">${itemRows}</table>
        <div style="margin-top:16px;padding:12px 16px;background:#f8f3e9;border-radius:12px;display:flex;justify-content:space-between">
          <span style="font-weight:700">المجموع الفرعي</span>
          <span style="font-weight:900;color:#8a1538">${currencyLabel(input.subtotal)}</span>
        </div>
        ${couponLine}
        <div style="margin-top:20px;text-align:center">
          <a href="${escapeHtml(input.resumeUrl)}" style="display:inline-block;background:#8a1538;color:#fff;font-weight:800;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px">
            أكمل عملية الشراء الآن ←
          </a>
        </div>
        <p style="margin-top:20px;font-size:12px;color:#94a3b8;text-align:center">
          إذا لم تعد مهتماً، يمكنك تجاهل هذه الرسالة بأمان.
        </p>
      </div>
    </div>
  `;

  const text = [
    headline,
    input.customerName ? `أهلاً ${input.customerName},` : "أهلاً بك,",
    "",
    "المنتجات في سلتك:",
    ...input.items.map((i) => `- ${i.title} (${currencyLabel(i.price)} × ${i.quantity})`),
    "",
    `المجموع: ${currencyLabel(input.subtotal)}`,
    input.couponCode ? `قسيمة خصم: ${input.couponCode} (${input.discountPercent}%)` : "",
    "",
    `أكمل الشراء: ${input.resumeUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
