import { prisma } from "./db";
import { normalizePurchaseEmail } from "./purchase-access";

export async function getPurchaseLibrary(email: string) {
  const normalizedEmail = normalizePurchaseEmail(email);

  const [orders, driveConnection] = await Promise.all([
    prisma.order.findMany({
      where: {
        email: normalizedEmail,
        status: "paid",
        purchaseTrackingConsent: true
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              include: { files: true }
            }
          }
        }
      }
    }),
    prisma.googleDriveConnection.findUnique({
      where: { email: normalizedEmail },
      select: { connectedAt: true, lastSyncedAt: true }
    })
  ]);

  return {
    email: normalizedEmail,
    drive: driveConnection
      ? {
          connected: true,
          connectedAt: driveConnection.connectedAt.toISOString(),
          lastSyncedAt: driveConnection.lastSyncedAt?.toISOString() ?? null
        }
      : { connected: false, connectedAt: null, lastSyncedAt: null },
    orders: orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      total: order.total,
      paymentMethod: order.paymentMethod,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productTitle: item.productTitle,
        price: item.price,
        quantity: item.quantity,
        files: item.product.files.map((file) => ({
          id: file.id,
          title: file.title,
          mimeType: file.mimeType,
          size: file.size
        }))
      }))
    }))
  };
}
