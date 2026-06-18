-- AlterTable
ALTER TABLE "Order" ADD COLUMN "purchaseTrackingConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "driveSyncConsent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PurchaseAccessToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleDriveConnection" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "GoogleDriveConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveFileSync" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriveFileSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_email_idx" ON "Order"("email");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_purchaseTrackingConsent_idx" ON "Order"("purchaseTrackingConsent");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseAccessToken_tokenHash_key" ON "PurchaseAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PurchaseAccessToken_email_idx" ON "PurchaseAccessToken"("email");

-- CreateIndex
CREATE INDEX "PurchaseAccessToken_expiresAt_idx" ON "PurchaseAccessToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleDriveConnection_email_key" ON "GoogleDriveConnection"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DriveFileSync_email_orderId_fileId_key" ON "DriveFileSync"("email", "orderId", "fileId");

-- CreateIndex
CREATE INDEX "DriveFileSync_email_idx" ON "DriveFileSync"("email");
