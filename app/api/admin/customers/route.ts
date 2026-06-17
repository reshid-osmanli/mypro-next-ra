import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const customers = await prisma.order.groupBy({
    by: ["email"],
    _count: { _all: true },
    _sum: { total: true },
    where: { status: "paid" },
    orderBy: { _count: { email: "desc" } },
    take: 100
  });

  return NextResponse.json({
    customers: customers.map((c) => ({
      email: c.email,
      orders: c._count._all,
      total: c._sum.total ?? 0
    }))
  });
}