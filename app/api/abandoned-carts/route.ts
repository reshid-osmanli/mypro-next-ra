import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkoutItemsSchema } from "@/lib/security-validation";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().email().max(160),
  customerName: z.string().trim().max(120).optional(),
  items: checkoutItemsSchema
});

function cartHash(productIds: string[]) {
  return crypto.createHash("sha256").update(productIds.sort().join("|")).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const ip = getRequestIp(req);
  if (isRateLimited(`abandoned-cart:${ip}`, 30, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "بيانات السلة غير صالحة" }, { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();
  const productIds = [...new Set(parsed.data.items.map((item) => item.id))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "published" },
    select: { id: true, title: true, price: true, slug: true }
  });
  if (!products.length) return NextResponse.json({ ok: true, skipped: true });

  const productMap = new Map(products.map((product) => [product.id, product]));
  const items = parsed.data.items
    .map((item) => productMap.get(item.id))
    .filter(Boolean) as typeof products;
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const hash = cartHash(items.map((item) => item.id));

  await prisma.abandonedCart.upsert({
    where: { email_cartHash: { email, cartHash: hash } },
    update: {
      customerName: parsed.data.customerName || null,
      itemsJson: JSON.stringify(items),
      subtotal,
      status: "active",
      reminderSentAt: null,
      convertedAt: null
    },
    create: {
      email,
      customerName: parsed.data.customerName || null,
      itemsJson: JSON.stringify(items),
      subtotal,
      cartHash: hash,
      status: "active"
    }
  });

  return NextResponse.json({ ok: true });
}
