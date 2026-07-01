# Voucher User Deposit Feature Plan

## Overview
Add functionality to the admin panel allowing admins to:
1. View all users with purchase statistics (total amount, order count)
2. Search and filter users
3. Select multiple users
4. Credit selected users' wallets with specified amounts and optional expiration dates

## Current State Analysis
- Database tables `GiftVoucher` and `VoucherUsage` exist in schema but may not be migrated
- `WalletTransaction` table exists for tracking credits/debits
- `creditWallet()` function exists in `lib/wallet.ts`
- `getAdminStats()` provides customer data but isn't exposed via API
- Current `VouchersTab` only supports creating and managing voucher codes (not user deposits)

## Changes Required

### 1. Migrate Database (if needed)
Run Prisma migration: `npx prisma db push`

### 2. New API Endpoint: `/api/admin/customers`
**File: `app/api/admin/customers/route.ts`**
- GET: Fetch all customers with stats (email, total spent, order count)
- Query: `prisma.order.groupBy` to aggregate by email

### 3. New API Endpoint: `/api/admin/wallet/credit`
**File: `app/api/admin/wallet/credit/route.ts`** (or update existing wallet API)
- POST: Credit multiple users' wallets
- Body: `{ emails: string[], amount: number, description: string, expiresAt?: string }`
- Uses `prisma.$transaction` for atomic operations

### 4. Enhance VouchersTab Component
**File: `components/admin-dashboard.tsx`**

Add to existing `VouchersTab`:
- Mode toggle: "Create Vouchers" | "Deposit to Users"
- User search input
- Multi-select user table with checkboxes
- Selected users count display
- Deposit form with amount and expiration date
- Submit to credit selected users

### 5. Wallet Database Schema Note
`WalletTransaction` tracks credits but doesn't have `expiresAt`. Options:
- Option A: Add `expiresAt` field to `WalletTransaction` model
- Option B: Include expiration info in `description` field
- Recommended: Option B (simpler, no migration needed)