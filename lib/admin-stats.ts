import { prisma } from "./db";

export type AdminStats = {
  totals: {
    orders: number;
    paidOrders: number;
    failedOrders: number;
    revenue: number;
    consentedEmails: number;
    driveConnections: number;
  };
  salesSeries: {
    daily: { label: string; revenue: number; orders: number }[];
    monthly: { label: string; revenue: number; orders: number }[];
  };
  topProducts: { title: string; quantity: number; revenue: number }[];
  customers: Array<{
    email: string;
    orders: number;
    total: number;
    consented: boolean;
  }>;
  recentOrders: Array<{
    id: string;
    email: string;
    customerName: string;
    total: number;
    status: string;
    paymentMethod: string;
    purchaseTrackingConsent: boolean;
    driveSyncConsent: boolean;
    affiliateEmail: string | null;
    affiliateCommission: number;
    createdAt: string;
    items: Array<{ productTitle: string; quantity: number; price: number }>;
  }>;
};

const emptyAdminStats: AdminStats = {
  totals: {
    orders: 0,
    paidOrders: 0,
    failedOrders: 0,
    revenue: 0,
    consentedEmails: 0,
    driveConnections: 0
  },
  salesSeries: { daily: [], monthly: [] },
  topProducts: [],
  customers: [],
  recentOrders: []
};

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function buildDailySeries(orders: { createdAt: Date; total: number }[]) {
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (29 - index));
    return dateKey(date);
  });
  const map = new Map(days.map((day) => [day, { label: day, revenue: 0, orders: 0 }]));
  for (const order of orders) {
    const key = dateKey(order.createdAt);
    const row = map.get(key);
    if (row) {
      row.revenue += order.total;
      row.orders += 1;
    }
  }
  return Array.from(map.values());
}

function buildMonthlySeries(orders: { createdAt: Date; total: number }[]) {
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCMonth(date.getUTCMonth() - (11 - index));
    return monthKey(date);
  });
  const map = new Map(months.map((month) => [month, { label: month, revenue: 0, orders: 0 }]));
  for (const order of orders) {
    const key = monthKey(order.createdAt);
    const row = map.get(key);
    if (row) {
      row.revenue += order.total;
      row.orders += 1;
    }
  }
  return Array.from(map.values());
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const now = new Date();
    const last30Days = new Date(now);
    last30Days.setUTCDate(last30Days.getUTCDate() - 29);
    last30Days.setUTCHours(0, 0, 0, 0);
    const last12Months = new Date(now);
    last12Months.setUTCMonth(last12Months.getUTCMonth() - 11);
    last12Months.setUTCDate(1);
    last12Months.setUTCHours(0, 0, 0, 0);

    const [orderCount, paidOrderCount, failedOrderCount, revenue, consentedCustomers, driveConnections, recentOrders, customerGroups, paidOrdersForCharts, paidItems] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: "paid" } }),
        prisma.order.count({ where: { status: "failed" } }),
        prisma.order.aggregate({ where: { status: "paid" }, _sum: { total: true } }),
        prisma.order.groupBy({
          by: ["email"],
          where: { status: "paid", purchaseTrackingConsent: true },
          _count: { _all: true },
          _sum: { total: true },
          orderBy: { _count: { email: "desc" } },
          take: 20
        }),
        prisma.googleDriveConnection.count(),
        prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { items: true }
        }),
        prisma.order.groupBy({
          by: ["email"],
          _count: { _all: true },
          _sum: { total: true },
          orderBy: { _count: { email: "desc" } },
          take: 50
        }),
        prisma.order.findMany({
          where: { status: "paid", createdAt: { gte: last12Months } },
          select: { total: true, createdAt: true }
        }),
        prisma.orderItem.findMany({
          where: { order: { status: "paid" } },
          select: { productTitle: true, quantity: true, price: true }
        })
      ]);

    const topMap = new Map<string, { title: string; quantity: number; revenue: number }>();
    for (const item of paidItems) {
      const current = topMap.get(item.productTitle) ?? { title: item.productTitle, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.price * item.quantity;
      topMap.set(item.productTitle, current);
    }

    return {
      totals: {
        orders: orderCount,
        paidOrders: paidOrderCount,
        failedOrders: failedOrderCount,
        revenue: revenue._sum.total ?? 0,
        consentedEmails: consentedCustomers.length,
        driveConnections
      },
      salesSeries: {
        daily: buildDailySeries(paidOrdersForCharts.filter((order) => order.createdAt >= last30Days)),
        monthly: buildMonthlySeries(paidOrdersForCharts)
      },
      topProducts: Array.from(topMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8),
      customers: customerGroups.map((item) => ({
        email: item.email,
        orders: item._count._all,
        total: item._sum.total ?? 0,
        consented: consentedCustomers.some((customer) => customer.email === item.email)
      })),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        email: order.email,
        customerName: order.customerName,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        purchaseTrackingConsent: order.purchaseTrackingConsent,
        driveSyncConsent: order.driveSyncConsent,
        affiliateEmail: order.affiliateEmail,
        affiliateCommission: order.affiliateCommission,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          productTitle: item.productTitle,
          quantity: item.quantity,
          price: item.price
        }))
      }))
    };
  } catch (error) {
    console.warn("[admin-stats] Database unavailable; returning empty stats", error);
    return emptyAdminStats;
  }
}
