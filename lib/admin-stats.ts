import { prisma } from "./db";

const emptyAdminStats = {
  totals: {
    orders: 0,
    paidOrders: 0,
    failedOrders: 0,
    revenue: 0,
    consentedEmails: 0,
    driveConnections: 0
  },
  customers: [] as { email: string; orders: number; total: number; consented: boolean }[],
  recentOrders: [] as {
    id: string;
    email: string;
    customerName: string;
    total: number;
    status: string;
    paymentMethod: string;
    purchaseTrackingConsent: boolean;
    driveSyncConsent: boolean;
    createdAt: string;
    items: { productTitle: string; quantity: number; price: number }[];
  }[]
};

export async function getAdminStats() {
  try {
    const [orderCount, paidOrderCount, failedOrderCount, revenue, consentedCustomers, driveConnections, recentOrders, customerGroups] =
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
        })
      ]);

    return {
      totals: {
        orders: orderCount,
        paidOrders: paidOrderCount,
        failedOrders: failedOrderCount,
        revenue: revenue._sum.total ?? 0,
        consentedEmails: consentedCustomers.length,
        driveConnections
      },
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
