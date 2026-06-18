import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  // Get all users who have signed in (from next-auth users table)
  const allUsers = await prisma.user.findMany({
    select: { email: true, name: true },
    orderBy: { id: "desc" },
    take: 200
  });

  // Get order stats for users who have paid orders
  const paidCustomers = await prisma.order.groupBy({
    by: ["email"],
    _count: { _all: true },
    _sum: { total: true },
    where: { status: "paid" },
    orderBy: { _count: { email: "desc" } },
    take: 100
  });

  // Merge: all signed-in users + any paid stats
  const paidMap = new Map(paidCustomers.map((c) => [c.email, { orders: c._count._all, total: c._sum.total ?? 0 }]));

  const merged = allUsers.map((u) => {
    const email = u.email ?? "";
    const paid = paidMap.get(email);
    return {
      email,
      name: u.name ?? "",
      orders: paid?.orders ?? 0,
      total: paid?.total ?? 0,
      isNewUser: !paid // flag to show this user is new (no paid orders yet)
    };
  });

  // Also add any paid customers who may not be in User table (guest checkouts)
  paidCustomers.forEach((c) => {
    if (!merged.find((m) => m.email === c.email)) {
      merged.push({
        email: c.email,
        name: "",
        orders: c._count._all,
        total: c._sum.total ?? 0,
        isNewUser: false
      });
    }
  });

  return NextResponse.json({
    customers: merged.sort((a, b) => (b.orders - a.orders) || (b.total - a.total))
  });
}
