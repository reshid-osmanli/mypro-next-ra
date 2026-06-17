import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const month = req.nextUrl.searchParams.get("month");
  const where: { createdAt?: { gte: Date; lt: Date } } = {};
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    where.createdAt = { gte: start, lt: end };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: true }
  });

  const header = [
    "orderId",
    "createdAt",
    "status",
    "customerName",
    "email",
    "phone",
    "paymentMethod",
    "total",
    "walletUsed",
    "voucherCode",
    "affiliateEmail",
    "affiliateCommission",
    "items"
  ];

  const rows = orders.map((order) => [
    order.id,
    order.createdAt.toISOString(),
    order.status,
    order.customerName,
    order.email,
    order.phone ?? "",
    order.paymentMethod,
    order.total,
    order.walletUsed,
    order.voucherId ?? "",
    order.affiliateEmail ?? "",
    order.affiliateCommission,
    order.items.map((item) => `${item.productTitle} x${item.quantity} @ ${item.price}`).join(" | ")
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const filename = `kutubi-orders-${month || new Date().toISOString().slice(0, 7)}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
