-- Create GiftVoucher + VoucherUsage tables (missing from previous migrations)
-- These models exist in the Prisma schema but were never migrated.

CREATE TABLE IF NOT EXISTS "GiftVoucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "GiftVoucher_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GiftVoucher_code_key" ON "GiftVoucher"("code");

CREATE TABLE IF NOT EXISTS "VoucherUsage" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "orderId" TEXT,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoucherUsage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VoucherUsage_email_idx" ON "VoucherUsage"("email");
CREATE INDEX IF NOT EXISTS "VoucherUsage_voucherId_idx" ON "VoucherUsage"("voucherId");
CREATE INDEX IF NOT EXISTS "VoucherUsage_usedAt_idx" ON "VoucherUsage"("usedAt");
