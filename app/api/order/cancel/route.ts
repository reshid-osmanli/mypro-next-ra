import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { releaseWalletReservation } from "@/lib/wallet";

const schema = z.object({
  order: z.string().trim().min(8).max(128)
});

export async function GET(req: NextRequest) {
  const parsed = schema.safeParse({ order: req.nextUrl.searchParams.get("order") });
  if (!parsed.success) return NextResponse.redirect(new URL("/checkout?payment=cancelled", req.url), 303);

  const order = await prisma.order.findUnique({ where: { id: parsed.data.order } });
  if (order?.status === "pending") {
    await releaseWalletReservation(order.id).catch(() => null);
    await prisma.order.update({ where: { id: order.id }, data: { status: "cancelled" } }).catch(() => null);
  }

  return NextResponse.redirect(new URL("/checkout?payment=cancelled", req.url), 303);
}
