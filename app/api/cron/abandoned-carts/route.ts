import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { sendSecurityEmail } from "@/lib/mailer";
import { resolveSiteUrl } from "@/lib/site-url";
import { currencyLabel } from "@/lib/utils";

export const runtime = "nodejs";

type StoredCartItem = { title?: string; slug?: string; price?: number };

function authorize(req: NextRequest) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return true;
  const header = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const query = req.nextUrl.searchParams.get("secret")?.trim();
  return header === expected || query === expected;
}

function buildVoucherCode() {
  return `RETURN10-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function createUniqueVoucher(amount: number) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = buildVoucherCode();
    try {
      return await prisma.giftVoucher.create({
        data: {
          code,
          amount,
          maxUses: 1,
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          isActive: true,
          createdBy: "abandoned-cart"
        }
      });
    } catch (error) {
      if (attempt === 7) throw error;
    }
  }
  throw new Error("تعذر إنشاء قسيمة السلة المتروكة");
}

async function processReminders() {
  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const siteUrl = resolveSiteUrl() || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const carts = await prisma.abandonedCart.findMany({
    where: {
      status: "active",
      reminderSentAt: null,
      updatedAt: { lte: threshold }
    },
    orderBy: { updatedAt: "asc" },
    take: 25
  });

  let sent = 0;
  for (const cart of carts) {
    const hasPaidAfterCart = await prisma.order.findFirst({
      where: { email: cart.email, status: "paid", createdAt: { gte: cart.updatedAt } },
      select: { id: true }
    });
    if (hasPaidAfterCart) {
      await prisma.abandonedCart.update({ where: { id: cart.id }, data: { status: "converted", convertedAt: new Date() } });
      continue;
    }

    const discountAmount = Math.max(1, Math.round(cart.subtotal * 0.1));
    const voucher = await createUniqueVoucher(discountAmount);
    const items = JSON.parse(cart.itemsJson || "[]") as StoredCartItem[];
    const itemsText = items.map((item) => `• ${item.title ?? "منتج رقمي"} (${currencyLabel(Number(item.price) || 0)})`).join("\n");
    const checkoutUrl = `${siteUrl}/checkout`;

    await sendSecurityEmail({
      to: cart.email,
      subject: "نسيت إكمال طلبك؟ خصم 10% بانتظارك",
      text: [
        `مرحبًا${cart.customerName ? ` ${cart.customerName}` : ""}،`,
        "",
        "لاحظنا أنك أضفت منتجات إلى السلة ولم تكمل الدفع.",
        "",
        itemsText,
        "",
        `استخدم القسيمة ${voucher.code} للحصول على خصم ${currencyLabel(voucher.amount)} خلال 14 يومًا.`,
        `إكمال الطلب: ${checkoutUrl}`
      ].join("\n"),
      html: `
        <div dir="rtl" style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;line-height:1.9;color:#111827">
          <h2 style="margin:0 0 12px">خصم خاص لإكمال طلبك</h2>
          <p>لاحظنا أنك أضفت منتجات إلى السلة ولم تكمل الدفع.</p>
          <div style="padding:12px 16px;border:1px solid #eee;border-radius:14px;background:#fafafa;white-space:pre-wrap">${itemsText}</div>
          <p>استخدم القسيمة:</p>
          <div style="display:inline-block;padding:10px 16px;border-radius:12px;background:#8a1538;color:#fff;font-weight:800;letter-spacing:1px">${voucher.code}</div>
          <p>قيمة الخصم: <strong>${currencyLabel(voucher.amount)}</strong></p>
          <p><a href="${checkoutUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:800">إكمال الطلب</a></p>
        </div>
      `
    });

    await prisma.abandonedCart.update({ where: { id: cart.id }, data: { status: "reminded", reminderSentAt: new Date() } });
    sent += 1;
  }

  return { scanned: carts.length, sent };
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await processReminders();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
