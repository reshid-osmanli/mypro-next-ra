// ============================================================================
// lib/abandoned-cart.ts — Improved abandoned cart email system
// ----------------------------------------------------------------------------
// New file: /lib/abandoned-cart-improved.ts
// Drop-in replacement for the existing lib that adds:
// - Time-windowed reminders (1h, 24h, 72h)
// - Coupon generation on second reminder
// - Status tracking
// ============================================================================

import { prisma } from "@/lib/db";
import crypto from "node:crypto";

const REMINDER_WINDOWS = [
  { hours: 1,  type: "first",  couponDiscount: 0,  label: "تذكير ودي" },
  { hours: 24, type: "second", couponDiscount: 5,  label: "خصم ترحيبي" },
  { hours: 72, type: "third",  couponDiscount: 10, label: "خصم أخير" },
];

export type CartSnapshot = {
  email: string;
  customerName?: string | null;
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    coverImage?: string | null;
  }>;
};

function cartHashFor(items: CartSnapshot["items"]) {
  const serialized = items
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((i) => `${i.id}:${i.quantity}`)
    .join("|");
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

export async function recordAbandonedCart(cart: CartSnapshot) {
  const normalizedEmail = cart.email.trim().toLowerCase();
  const cartHash = cartHashFor(cart.items);
  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  try {
    const existing = await prisma.abandonedCart.findUnique({
      where: { email_cartHash: { email: normalizedEmail, cartHash } },
    });

    if (existing) {
      await prisma.abandonedCart.update({
        where: { id: existing.id },
        data: {
          itemsJson: JSON.stringify(cart.items),
          subtotal,
          status: "active",
          updatedAt: new Date(),
          customerName: cart.customerName ?? existing.customerName,
        },
      });
      return existing;
    }

    return await prisma.abandonedCart.create({
      data: {
        email: normalizedEmail,
        customerName: cart.customerName ?? null,
        itemsJson: JSON.stringify(cart.items),
        subtotal,
        cartHash,
        status: "active",
      },
    });
  } catch (error) {
    console.warn("[abandoned-cart] Unable to record cart", error);
    return null;
  }
}

export async function getCartsReadyForReminder() {
  const now = new Date();
  const out: Array<{ cartId: string; reminderType: string; couponCode?: string }> = [];

  for (const window of REMINDER_WINDOWS) {
    const reminderStart = new Date(now.getTime() - window.hours * 60 * 60 * 1000);
    const reminderEnd = new Date(reminderStart.getTime() - 30 * 60 * 1000); // 30-min guard

    const carts = await prisma.abandonedCart.findMany({
      where: {
        status: "active",
        updatedAt: { gte: reminderEnd, lt: reminderStart },
        // Don't re-send the same window twice
        reminderSentAt: null,
      },
      take: 100,
    });

    for (const cart of carts) {
      let couponCode: string | undefined;
      if (window.couponDiscount > 0) {
        couponCode = await ensureCouponForCart(cart.email, window.couponDiscount);
      }
      out.push({ cartId: cart.id, reminderType: window.type, couponCode });
    }
  }

  return out;
}

async function ensureCouponForCart(email: string, discountPercent: number): Promise<string> {
  const code = `WELCOME-${email.slice(0, 4).toUpperCase()}-${discountPercent}`;
  const amount = discountPercent * 100; // percent → minor currency units (e.g. 5% = 500)
  try {
    await prisma.giftVoucher.upsert({
      where: { code },
      create: {
        code,
        amount,
        maxUses: 1,
        createdBy: "abandoned-cart-bot",
        isActive: true,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      update: {},
    });
    return code;
  } catch {
    return code;
  }
}

export async function markReminderSent(cartId: string) {
  await prisma.abandonedCart.update({
    where: { id: cartId },
    data: { reminderSentAt: new Date() },
  });
}
