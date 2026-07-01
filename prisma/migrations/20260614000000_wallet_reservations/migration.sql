-- Reserve wallet balance during checkout so credit is not lost on failed payments
CREATE TABLE IF NOT EXISTS "WalletReservation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'reserved',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletReservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WalletReservation_orderId_key" ON "WalletReservation"("orderId");
CREATE INDEX IF NOT EXISTS "WalletReservation_email_idx" ON "WalletReservation"("email");
CREATE INDEX IF NOT EXISTS "WalletReservation_expiresAt_idx" ON "WalletReservation"("expiresAt");
CREATE INDEX IF NOT EXISTS "WalletReservation_status_idx" ON "WalletReservation"("status");
