-- Production hardening: Bundle, UpsellRule, RefreshTokenFamily

CREATE TABLE IF NOT EXISTS "Bundle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "compareAt" INTEGER,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "coverImage" TEXT,
    "badge" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Bundle_slug_key" ON "Bundle"("slug");
CREATE INDEX IF NOT EXISTS "Bundle_active_sortOrder_idx" ON "Bundle"("active", "sortOrder");

CREATE TABLE IF NOT EXISTS "BundleItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BundleItem_bundleId_productId_key" ON "BundleItem"("bundleId", "productId");

CREATE TABLE IF NOT EXISTS "UpsellRule" (
    "id" TEXT NOT NULL,
    "triggerProductId" TEXT,
    "triggerCategory" TEXT,
    "triggerSubject" TEXT,
    "suggestProductId" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UpsellRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UpsellRule_active_priority_idx" ON "UpsellRule"("active", "priority");
CREATE INDEX IF NOT EXISTS "UpsellRule_triggerProductId_idx" ON "UpsellRule"("triggerProductId");
CREATE INDEX IF NOT EXISTS "UpsellRule_triggerCategory_idx" ON "UpsellRule"("triggerCategory");
CREATE INDEX IF NOT EXISTS "UpsellRule_triggerSubject_idx" ON "UpsellRule"("triggerSubject");

CREATE TABLE IF NOT EXISTS "RefreshTokenFamily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "currentTokenHash" TEXT NOT NULL,
    "parentTokenHash" TEXT,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RefreshTokenFamily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RefreshTokenFamily_currentTokenHash_key" ON "RefreshTokenFamily"("currentTokenHash");
CREATE INDEX IF NOT EXISTS "RefreshTokenFamily_userId_idx" ON "RefreshTokenFamily"("userId");
CREATE INDEX IF NOT EXISTS "RefreshTokenFamily_email_idx" ON "RefreshTokenFamily"("email");
CREATE INDEX IF NOT EXISTS "RefreshTokenFamily_expiresAt_idx" ON "RefreshTokenFamily"("expiresAt");
CREATE INDEX IF NOT EXISTS "RefreshTokenFamily_revokedAt_idx" ON "RefreshTokenFamily"("revokedAt");
