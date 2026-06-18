-- Growth features: previews/reviews trust layer, abandoned carts, affiliates, blog, and analytics support.

ALTER TABLE "Order" ADD COLUMN "affiliateCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "affiliateEmail" TEXT;
ALTER TABLE "Order" ADD COLUMN "affiliateCommission" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ProductReview" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "orderId" TEXT,
  "email" TEXT NOT NULL,
  "customerName" TEXT,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AbandonedCart" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "customerName" TEXT,
  "itemsJson" TEXT NOT NULL,
  "subtotal" INTEGER NOT NULL,
  "cartHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "reminderSentAt" TIMESTAMP(3),
  "convertedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AbandonedCart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateProfile" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "commissionRate" INTEGER NOT NULL DEFAULT 10,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AffiliateProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateCommission" (
  "id" TEXT NOT NULL,
  "affiliateId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "orderEmail" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "rate" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'credited',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AffiliateCommission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogPost" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "coverImage" TEXT,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "relatedProductId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductReview_productId_email_key" ON "ProductReview"("productId", "email");
CREATE INDEX "ProductReview_productId_idx" ON "ProductReview"("productId");
CREATE INDEX "ProductReview_email_idx" ON "ProductReview"("email");
CREATE INDEX "ProductReview_approved_idx" ON "ProductReview"("approved");

CREATE UNIQUE INDEX "AbandonedCart_email_cartHash_key" ON "AbandonedCart"("email", "cartHash");
CREATE INDEX "AbandonedCart_email_idx" ON "AbandonedCart"("email");
CREATE INDEX "AbandonedCart_status_updatedAt_idx" ON "AbandonedCart"("status", "updatedAt");

CREATE UNIQUE INDEX "AffiliateProfile_email_key" ON "AffiliateProfile"("email");
CREATE UNIQUE INDEX "AffiliateProfile_code_key" ON "AffiliateProfile"("code");

CREATE UNIQUE INDEX "AffiliateCommission_orderId_key" ON "AffiliateCommission"("orderId");
CREATE INDEX "AffiliateCommission_affiliateId_idx" ON "AffiliateCommission"("affiliateId");
CREATE INDEX "AffiliateCommission_orderEmail_idx" ON "AffiliateCommission"("orderEmail");
CREATE INDEX "AffiliateCommission_createdAt_idx" ON "AffiliateCommission"("createdAt");

CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_published_idx" ON "BlogPost"("published");
CREATE INDEX "BlogPost_relatedProductId_idx" ON "BlogPost"("relatedProductId");

CREATE INDEX "Order_affiliateEmail_idx" ON "Order"("affiliateEmail");

ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
