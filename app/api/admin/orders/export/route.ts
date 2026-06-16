import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true }
    });

    const csvRows = [
      ["Order ID", "Date", "Customer Name", "Email", "Phone", "Status", "Payment Method", "Total (USD)", "Items", "Voucher Used", "Wallet Used"]
    ];

    for (const order of orders) {
      const itemsString = order.items.map((i) => `${i.quantity}x ${i.productTitle}`).join(" | ");
      csvRows.push([
        order.id,
        order.createdAt.toISOString(),
        order.customerName,
        order.email,
        order.phone || "",
        order.status,
        order.paymentMethod,
        (order.total / 100).toFixed(2),
        itemsString,
        order.voucherId || "",
        (order.walletUsed / 100).toFixed(2)
      ]);
    }

    const csvContent = csvRows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const headers = new Headers();
    headers.set("Content-Type", "text/csv; charset=utf-8");
    headers.set("Content-Disposition", `attachment; filename="orders-${new Date().toISOString().split("T")[0]}.csv"`);

    return new NextResponse(csvContent, { status: 200, headers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to export orders" }, { status: 500 });
  }
}
