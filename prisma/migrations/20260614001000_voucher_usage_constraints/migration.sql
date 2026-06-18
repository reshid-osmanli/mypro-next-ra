-- Prevent double voucher usage by the same email or duplicate capture for the same order.
-- If this migration fails because old duplicate rows already exist, remove duplicate VoucherUsage rows then rerun `npx prisma migrate deploy`.
CREATE UNIQUE INDEX IF NOT EXISTS "VoucherUsage_orderId_key" ON "VoucherUsage"("orderId");
CREATE UNIQUE INDEX IF NOT EXISTS "VoucherUsage_voucherId_email_key" ON "VoucherUsage"("voucherId", "email");
