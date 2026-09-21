# Kutubi — Architecture Audit (Phase 0)

> Date: 2026-09-21
> Method: full code read + actual local execution (Next.js 15.5.18, embedded PostgreSQL 18, real
> migrations + seed + HTTP smoke tests). Documentation files in the repo were treated as
> untrusted; every claim below was verified against the code or the running app unless marked
> **NOT VERIFIED**.
>
> This sandbox cannot reach `binaries.prisma.sh`, so Prisma engine binaries were stubbed for
> CLI use and the app was run with the driver-adapter client (`@prisma/adapter-pg`, temporary
> local patch — see "Sandbox-only changes"). In a normal network `npm install` works as-is.

---

## 1. Current architecture

- **Stack**: Next.js 15.5.18 (App Router, Node runtime), React 19, TypeScript (strict),
  Tailwind 3, Prisma 6.19.3 + PostgreSQL, next-auth (Auth.js) 5 beta (customer login, Google
  OAuth optional), next-intl (locale cookie, no URL prefix), Stripe SDK + raw PayPal REST
  calls, Cloudinary (manual signed upload, no SDK), Resend via raw fetch, framer-motion,
  lucide-react, zod (API validation), Sentry (present in deps, **not wired**).
- **Shape**: a **modular monolith in the making, not yet modular**. Business logic lives in
  `lib/*.ts` flat files (50+ modules) called directly from route handlers and from the 1832-line
  admin component. There is no `lib/domain/`, no repositories layer, no service layer.
  Routes are medium-thick (70–240 lines each) and contain business rules inline
  (pricing in two different routes, fulfillment side-effects in three different routes).
- **Rendering**: almost all pages are `force-dynamic`. Checkout + cart pages are static/client.
  There is no ISR anywhere.
- **Data**: PostgreSQL via Prisma. 29 tables after migrations (plus 2 tables that exist in the
  schema but **not** in migrations — see §10).
- **Module map (current)**:

| Area | Where |
|---|---|
| Catalog | `lib/catalog.ts`, `lib/bundle-system.ts`, `lib/upsell-suggestions.ts`, `lib/bundle-discounts.ts` |
| Checkout/pricing | duplicated inline in `app/api/checkout/route.ts` and `app/api/paypal/create-order/route.ts` |
| Payments | `lib/payments.ts` (Stripe + PayPal in one file), `app/api/stripe/complete`, `app/api/paypal/*` |
| Wallet/vouchers | `lib/wallet.ts` (wallet + vouchers together) |
| Affiliates | `lib/affiliates.ts` |
| Downloads | `lib/order-access.ts`, `lib/download-token.ts` (duplicated), `lib/stored-files.ts`, `lib/zip.ts` |
| Files/uploads | `lib/cloudinary.ts`, `lib/upload-policy.ts`, `lib/local-uploads.ts`, `app/api/admin/uploads`, `app/api/admin/signed-upload` |
| Auth (customer) | `auth.ts`, `auth.config.ts`, `middleware.ts` |
| Auth (admin) | `lib/admin-auth.ts`, `lib/admin-credentials.ts`, `lib/admin-credentials-bcrypt.ts` |
| Security helpers | `lib/rate-limit.ts`, `lib/request-security.ts`, `lib/security/{csrf,honeypot,turnstile,refresh-token-rotation}.ts` |
| Email | `lib/mailer.ts`, `lib/emails/abandoned-cart-template.ts` |
| Drive | `lib/google-drive.ts`, `app/api/purchases/drive/*` |
| Admin UI | `components/admin-dashboard.tsx` (1832 lines, single component, tabs) |
| Storefront UI | `components/*.tsx` (40+ small components), `components/cart-provider.tsx` (localStorage cart) |
| Monitoring | `lib/monitoring.ts` (Sentry helpers, never invoked by the app), `lib/report-caught-error.ts` (console + optional Sentry capture), `instrumentation.ts` (no-op) |

---

## 2. Routes (pages)

Verified by `next build` output and runtime.

| Route | Rendering | Notes |
|---|---|---|
| `/` | force-dynamic | Hero from DB settings, featured products, **fake stats** (`featured.length \|\| 3+`, hardcoded `5GB+`) |
| `/products` | force-dynamic | **Loads all products**, client-side search/grade/subject only; no pagination, no price/rating/sort, no category/format filters |
| `/products/[slug]` | force-dynamic | Real product page (gallery, price, files, reviews, related); `generateMetadata` with canonical; **no hreflang** |
| `/library`, `/library/[grade]`, `/library/[grade]/[subject]` | force-dynamic | Browse by grade/subject; content pages from DB |
| `/cart` | force-dynamic | Client cart (localStorage `kutubi-cart-v2`) |
| `/checkout` | static | Client form; price computed client-side for display, re-computed server-side |
| `/thank-you` | force-dynamic | Reads download-session cookie server-side; drives auto download |
| `/purchases` | force-dynamic, **auth-protected (middleware)** | Purchase library + re-issue downloads + Drive sync |
| `/login`, `/signup` | force-dynamic | Auth.js (Google) |
| `/admin`, `/admin/login` | force-dynamic | Admin gate in page (redirect), 2-step email-OTP login |
| `/blog`, `/blog/[slug]` | force-dynamic | Blog posts |
| `/affiliates` | force-dynamic | Affiliate dashboard |
| `/bundles/[slug]` | **DOES NOT EXIST** | Linked from bundle cards → 404 (broken feature, see §7) |
| 404 / 500 / global-error | — | exist, minimal |

## 3. API routes

All routes use `runtime = nodejs` where relevant. Auth/behavior verified at runtime where noted.

| Route | Method(s) | Auth | Verified behavior |
|---|---|---|---|
| `/api/checkout` | POST | guest (CSRF HMAC required) | Validates, computes price, creates order, Stripe session. **No idempotency** (2 parallel POSTs → 2 orders, reproduced). Stripe unconfigured → 500 + order `failed` (reproduced) |
| `/api/stripe/complete` | **GET** | none (session id in URL) | **The only Stripe payment confirmation path. No webhook exists.** GET mutates: marks paid, applies voucher, captures wallet, credits affiliate. Amount/currency verified against Stripe API |
| `/api/paypal/create-order` | POST | none (guest) | Duplicated pricing logic; creates local order + PayPal order; wallet reserved |
| `/api/paypal/capture-order` | POST | **NONE** | Looks up order by PayPal `providerOrderId`, captures, marks paid, issues download session. **No ownership check** (reproduced 404 probe without auth). IDOR — P0 |
| `/api/order/cancel` | **GET** | none | Cancels order + releases wallet (GET mutation) |
| `/api/order/redeem` | **GET** | claim token in URL | Consumes claim, issues session (GET mutation) |
| `/api/order/download-package` | POST | download-session cookie | Zips all order files through the Next server; one-time-ish session (hash + expiry + usedAt) |
| `/api/download` | POST | one-time `DownloadToken` (atomic consume) | Verified 403 without valid token. Serves single file |
| `/api/order/issue-download-links` | POST | — | Returns 410 (deprecated, intentional) |
| `/api/purchases` | GET | session | Purchase library |
| `/api/purchases/verify`, `/request-link` | POST | session | verify = real; request-link = **stub** (always returns ok) |
| `/api/purchases/drive/start` GET / `callback` GET / `sync` POST | session / OAuth / session | Optional feature (env-gated) |
| `/api/wallet` | GET | session | Wallet balance + transactions |
| `/api/vouchers/validate` | POST | session | — |
| `/api/vouchers/available` | POST | — | — |
| `/api/products/[id]/reviews` | GET/POST | GET public; POST session + **verified purchase required** (good) | Upsert sets `approved: true` (self-unmoderation, minor) |
| `/api/abandoned-carts` | POST | guest | Saves cart snapshot |
| `/api/cron/abandoned-carts` | GET/POST | `CRON_SECRET` **optional — endpoint is OPEN when unset** (re-read from code) | Sends reminder emails, creates one-use vouchers |
| `/api/admin/login` `+verify` `+resend`, `/api/admin/logout` | POST | admin creds | 2-step: password → email OTP → HMAC session cookie. Verified full flow (wrong pw 401, devCode path, verify, session) |
| `/api/admin/products[?/[id]]` | POST/PATCH/DELETE | admin | Zod-validated; DELETE protects sold products (409 + archive suggestion) |
| `/api/admin/grades[?/[id]]`, `/subjects`, `/pages`, `/settings` | CRUD | admin | — |
| `/api/admin/uploads`, `/signed-upload` | POST | admin | Multipart or Cloudinary signed params |
| `/api/admin/diagnose-files` | GET | admin | File reachability diagnostics |
| `/api/admin/orders/export` | GET | admin | CSV export via `<a href>` (token in URL) |
| `/api/admin/vouchers[?/[id]]` | CRUD | admin | — |
| `/api/admin/customers` | — | admin | — |
| `/api/admin/wallet/transaction` | POST | admin | Manual wallet credit |
| `/api/affiliates/profile` | GET/POST | session | — |
| `/api/auth/[...nextauth]` | — | — | Auth.js |
| **`/api/health*`** | — | — | **DOES NOT EXIST** |

**GET-mutation endpoints (spec §27 violations):** `/api/stripe/complete`, `/api/order/cancel`,
`/api/order/redeem`, `/api/admin/orders/export` (export is arguably OK but still GET-with-secret).

## 4. Authentication

- **Customers**: Auth.js (JWT strategy, 30 days), Google OAuth provider (only if
  `AUTH_GOOGLE_ID/SECRET` set). Guest checkout supported (email in form). `authorized() => true`
  (open middleware, protection per-route). Session email normalized lowercase.
  **NOT VERIFIED at runtime**: Google OAuth flow (no Google creds in sandbox).
- **Admins**: separate system. `AdminUser` table (bcrypt or legacy scrypt hash), 2-step login:
  password → 8-digit code emailed via Resend (in dev, code returned in response as `devCode`) →
  signed HMAC session cookie `kutubi-admin` (7 days). Requires `ADMIN_SESSION_SECRET` ≥ 32 chars
  (throws otherwise). Login rate-limited (in-memory) per IP and per email.
- **Weaknesses**: `AUTH_SECRET` fallback chain in `auth.config.ts`
  (`AUTH_SECRET ?? NEXTAUTH_SECRET ?? ADMIN_SESSION_SECRET ?? "dev-secret-placeholder..."`) —
  a production deploy missing `AUTH_SECRET` would silently run on the fallback or the admin
  secret; no env validation layer exists (no `lib/env.ts`).

## 5. Authorization

- Customer routes: middleware protects `/purchases*` only. Most customer APIs check `auth()`
  inside the handler. **`/api/paypal/capture-order` checks nothing** (P0, see §7).
- Admin routes: each handler calls `requireAdminRequest` (cookie HMAC). Verified 401 without
  session.
- **No RBAC**: `AdminUser.role` is a free string, default `"admin"`, never read for
  authorization anywhere. No permission model, no second admin role in use.
- **Ownership**: purchases are keyed by email (string), not by `User.id`. A logged-in user and
  a guest sharing an email see the same purchase/wallet. Wallet/affiliate/voucher tables are
  all email-keyed.
- Downloads: one-time tokens (hash stored), expiry, atomic consume — good. Download session
  cookie (hash + expiry + `usedAt`) — good. No per-purchase "re-issue" cap beyond session reuse.

## 6. Database

- Provider: PostgreSQL. Prisma 6.19.3. 8 migration folders, hand-maintained SQL.
- `package.json` has `db:push` (dangerous as a deploy mechanism) and `db:seed`; **no
  `migrate:deploy` script**; CI runs `prisma migrate deploy`.
- **Seed** (`prisma/seed.ts`): destructive (`deleteMany` on 14 tables, no warning/flag),
  Arabic-only content, 3 products **with no files** (checkout is blocked for all seeded
  products — reproduced), 1 admin from env, 1 content page, 2 blog posts.
- Money: integer minor units everywhere (good). Single global currency per provider env
  (`STRIPE_CURRENCY` vs `NEXT_PUBLIC_PAYPAL_CURRENCY` — can diverge; no currency column on
  `Order`).
- No enums anywhere: `Product.status`, `Order.status`, `Order.paymentMethod`,
  `WalletReservation.status`, `WalletTransaction.type`, `AffiliateCommission.status`,
  `AbandonedCart.status`, `AdminUser.role` are all free strings.
- No `Payment` entity, no `PaymentEvent` (webhook idempotency), no `Refund`, no `AuditLog`,
  no `DigitalAsset`, no `ProductTranslation`, no `CheckoutQuote`.
- Indexes: present on the hot lookup columns (email, status, expiresAt, voucher code, etc.).
  `Order.total`/`status` covered. Reasonable baseline; no composite for (status, createdAt).

## 7. Payments — findings (all runtime-verified where possible)

### P0-1. No Stripe webhook; payment truth = return URL
- There is **no Stripe webhook endpoint at all**. `STRIPE_WEBHOOK_SECRET` is in `.env.example`
  but unused by any code.
- Confirmation happens in `GET /api/stripe/complete` (the `success_url`): it fetches the
  session from Stripe with the secret key, checks `amount_total === order.total*100` and
  currency, then marks paid + fulfills. If the user closes the tab after paying (or Stripe's
  redirect is blocked), the order stays `pending` forever with no recovery path (no webhook,
  no cron). A GET performs the entire fulfillment (see §27 issues).
- The return-URL flow does re-verify against Stripe's API, which is better than trusting the
  redirect alone, but it is still not the source of truth and is not idempotent across
  retries of the fulfillment side-effects (voucher/wallet/affiliate each guard themselves).

### P0-2. `/api/paypal/capture-order` is unauthenticated (IDOR)
- No session, no ownership, no CSRF token (only the broken origin check, §8). Any unauthenticated
  POST with a pending PayPal order ID captures the payment and receives the paid download
  session cookie. Reproduced: unauthenticated probe returns order-existence signal (404 vs
  processing path). PayPal order IDs are not unguessable secrets (they appear in PayPal
  emails/notifications and in the `create-order` response of the owner's browser).
- Capture itself is validated server-side (amount/currency/reference) so there is no free-goods
  path, but the **authorization gap is real and exploitable**.

### P0-3. No checkout idempotency (double-charge path)
- Reproduced: two parallel `POST /api/checkout` → two `Order` rows (3 total after test).
  No client token / idempotency key; rate limit (10/15 min/IP) is per-process in memory and
  would not stop a fast double-click. Same risk on PayPal `create-order`.

### P0-4. Voucher & wallet races
- `applyVoucher`: checks `usedCount >= maxUses` then `increment` — no row lock/unique guard on
  the count (the `VoucherUsage` uniques prevent double-usage per email/order, but the global
  `maxUses` can be exceeded under concurrency).
- `captureWalletReservation`: find-then-update without `updateMany` guard; two concurrent
  captures can both pass the `reserved` check → duplicate debit `WalletTransaction` rows
  (balance itself is decremented once at reservation, so no double-spend, but the ledger
  corrupts). `WalletTransaction` has no unique on `(orderId, type)`.
- `releaseWalletReservation` / expired-reservation sweep use `updateMany` guards (good).

### P1. Fulfillment logic triplicated
"Mark paid → apply voucher → capture wallet → affiliate → abandoned-cart convert" exists in
three copies with slightly different code: `issueFreePaidResponse` (checkout),
`/api/stripe/complete`, `/api/paypal/capture-order`. Each uses `.catch(() => null)` around
voucher/wallet/affiliate — **failures are silently swallowed** (a failed voucher apply after
payment is invisible to ops).

### P1. Stripe session uses a per-checkout coupon
`createStripeDiscount` creates a one-off Stripe coupon for the discount amount on every
checkout — works, but it means the Stripe dashboard fills with unused coupons and the
discount is not represented as a proper line item.

## 8. Security — verified findings

| # | Severity | Finding |
|---|---|---|
| S1 | P0 | Origin check is a no-op: `isTrustedOrigin` returns `true` for **any** request carrying an `Origin` or `Referer` header (last line: `return true; // Trusted by default`). PayPal create/capture + downloads rely solely on it. Only `/api/checkout` has a real HMAC CSRF token |
| S2 | P0 | `/api/paypal/capture-order` IDOR (see §7) |
| S3 | P0 | "Private" product files are stored as **public** Cloudinary assets (folder `kutubi/private-products` is naming only; upload uses default `type=public`; `readStoredFile` fetches the unsigned `secure_url`). Paid files are reachable by anyone with the URL |
| S4 | P1 | In-memory rate limiting (`globalThis` Map) — per function instance on Vercel; not a real limiter in production serverless |
| S5 | P1 | `/api/cron/abandoned-carts` open when `CRON_SECRET` unset (`if (!expected) return true`) → unauthenticated email sending + voucher creation |
| S6 | P1 | `AUTH_SECRET` dev-placeholder fallback chain in `auth.config.ts` |
| S7 | P1 | Admin session cookie: HMAC, 7-day TTL, no rotation, no revocation list; inactive-admin flag exists but is only checked at login |
| S8 | P2 | Security headers duplicated between `next.config.mjs` and `middleware.ts` (drift risk); CSP only in production and only via middleware; no CSP on API responses in dev |
| S9 | P2 | Admin login `devCode` is returned in the API response whenever the mailer runs in dev mode — ensure it can never leak to prod (guarded by `NODE_ENV !== "production"` today) |
| S10 | P2 | `/private-uploads/[...path]` (admin-only) and `/uploads/[...path]` (public) serve from **local disk** — on Vercel this is empty, and in self-hosted modes the public route serves whatever is in `public/uploads` (covers can be paid files if mis-uploaded; policy distinguishes, but the route does not) |

Positives verified: one-time download tokens with atomic consume; hashed (not raw) tokens in
DB; download session expiry + `usedAt`; path-traversal guards in upload/download routes;
upload policy checks extension + MIME + magic bytes (`hasValidUploadSignature`); reviews
require verified purchase; admin deletes of sold products are blocked (archive instead);
`next-auth` `trustHost` is appropriate behind Vercel.

## 9. File / storage architecture

- `ProductFile.url` is the source of truth: either `/private-uploads/<file>` (local disk),
  `/uploads/<file>` (public disk), or a Cloudinary URL. No `DigitalAsset` entity, no
  `storageProvider`/`storageKey` split, no checksum, no visibility flag, no versions.
- Uploads: multipart through the Next server (`/api/admin/uploads`, 5GB max policy!) or
  signed-upload params to Cloudinary (`/api/admin/signed-upload`). **5GB through a serverless
  function body is not viable on Vercel**; the policy allows it.
- Checkout readiness (`validateCheckoutReadiness`) **downloads every file's full byte content**
  (`readStoredFile` → `readFile`/`fetch arrayBuffer`) to verify reachability before payment.
  Wasteful and slow for multi-MB files; fails checkout for any transient network hiccup.
- Download delivery: `/api/download` (single file) and `/api/order/download-package`
  (zips everything through the server, in-memory `Buffer`) — both read full file content
  through Next. Fine for small files, breaks at scale.
- Storage health: `/api/admin/diagnose-files` + "diagnose" admin tab (reachability check +
  re-upload to Cloudinary) — a good start, but it checks reachability by downloading.
- Google Drive: optional, env-gated, OAuth via `GOOGLE_CLIENT_ID/SECRET` (same vars as
  customer login — collision risk; `.env.example` lists both).

## 10. Database — VERIFIED migration problems (reproduced on fresh PG 18)

1. **P0 — Migration ordering failure**: `20260614001000_voucher_usage_constraints` creates
   unique indexes on `VoucherUsage`, but the table is created by the *later*
   `20260616010000_create_voucher_tables`. On a fresh database
   `prisma migrate deploy` fails with `relation "VoucherUsage" does not exist`.
   (Reproduced: applied in timestamp order, 4th migration failed. CI should be red on a
   fresh Postgres service.)
2. **P0 — Schema/migration drift (schema is ahead of migrations)**:
   - Missing columns: `Product.additionalImages`, `Product.motionEnabled`,
     `Product.motionPosition`, `Product.motionScale`, `Product.motionRotation`,
     `Product.motionSrc`; `Order.voucherId`, `Order.walletUsed`
   - Missing tables: `UserWallet`, `WalletTransaction`
   Consequences on a fresh DB: wallet feature throws (`getOrCreateWallet`), voucher apply
   throws, admin product create with motion fields throws. (Reproduced: seed + checkout
   crashed until the columns/tables were added manually to the local test DB.)
   The production DB evidently has these (the app is running there), so this only breaks
   fresh setups + CI — but it means **migrations are not the source of truth** and no
   `migrate dev` discipline was followed.
3. No migration for `_prisma_migrations` bookkeeping verification, no rollback scripts,
   no pre/post checks.

## 11. Order architecture

- `Order` status values in use: `pending`, `paid`, `failed`, `cancelled` (free strings).
  No state machine; any handler can set any value (e.g. the GET endpoint can set `paid`).
- `OrderItem` keeps `productTitle` + `price` snapshots (partial immutable snapshot — good
  start) but no `currency`, no per-item discount/compareAt, `orderId` is nullable
  (orphan items possible; used? — `OrderItem.orderId` nullable with `SetNull`).
- `Order` also carries: provider order/capture ids, voucher id, wallet used, affiliate
  code/email/commission, consent flags, and **three generations of download-token columns**
  (`downloadClaim*`, `downloadSession*`) — the download domain is smeared across the order row.
- `Payment`, `PaymentAttempt`, `Refund` entities do not exist. No refund capability at all
  (admin has no refund action; order tab is read-only stats + CSV export).
- No `CheckoutQuote` — the quote is recomputed at each endpoint from live prices
  (spec §19 not implemented).

## 12. Wallet / vouchers / affiliates

- Wallet keyed by **email** (unique), `balance Int`, transactions ledger `WalletTransaction`,
  reservations `WalletReservation` (unique orderId, 45-min TTL, expired-sweep).
  Reserve → capture/release lifecycle exists and is mostly correct (see §7 P0-4 races).
- Vouchers = fixed-amount `GiftVoucher` (code, amount, maxUses, per-email unique usage,
  optional expiry). No percentage type, no min-order, no product/category scoping.
  Consumption happens **after** payment (in fulfillment), not at quote — a failed apply is
  swallowed (P1).
- Affiliates: `kutubi_ref` cookie set by middleware from `?ref=`; attribution at checkout;
  10% of order total credited to the affiliate's wallet at fulfillment (idempotent via
  unique `AffiliateCommission.orderId` + `affiliateCommission > 0` guard). No reversal on
  refund (no refunds exist). Self-referral blocked.

## 13. Product / catalog model

- `Product` carries **all** content and commerce in one table: title/excerpt/description
  (Arabic only), `grade`, `subject`, `category`, `format`, `pages`, `level` as **free strings**,
  price/compareAt, `status` string, `featured`, accent colors, motion video fields,
  `additionalImages String[]`, coverImage.
- `Grade` + `Subject` tables exist (and are managed in admin) but **Product does not reference
  them** — matching is by exact Arabic string equality (`Product.grade === "الصف الرابع"`),
  which is locale-fragile and bypasses the catalog tables entirely.
- No `ProductTranslation` — the English locale renders Arabic product content verbatim.
- No enums, no publication workflow validation beyond "files required to check out"
  (readiness check happens at checkout time, not at publish time — spec §115/§116 not
  implemented; a product can be `published` with an empty description and nothing stops it).
- Two conflicting "bundle" systems: (a) DB `Bundle`/`BundleItem` (+ `UpsellRule`) tables with
  their own prices, rendered as cards; (b) hardcoded `calculateBundleDiscount`
  (20% off 3+ items of same grade+subject) used by checkout. Bundle cards add the **bundle
  id as if it were a product** to the cart → checkout fails (product lookup by bundle id
  throws → 500). `/bundles/[slug]` link 404s. **Bundles are a broken feature end-to-end.**
- `ContentPage` (grade/subject pages) is Arabic only, single locale.

## 14. Downloads & delivery

- Verified good: one-time `DownloadToken` (hash, expiry, atomic `usedAt` consume, 403 without),
  download-session cookie flow (hash + 20-min expiry + `usedAt`), `/api/download` 405 on GET,
  rate limits on download endpoints.
- Gaps: no per-purchase download count/limits, no abuse analytics, delivery proxies full file
  bytes through Next (memory/timeout risk), local-disk storage is not durable on Vercel
  (production requires Cloudinary; readiness check blocks checkout otherwise — reproduced).

## 15. Admin

- One page (`/admin`) → one 1832-line client component (`admin-dashboard.tsx`) with tabs:
  products, grades, pages, uploads, diagnose, pricing, vouchers, orders, settings.
  All data is preloaded by the server page (`getAllProducts()` — every product with files and
  reviews — plus pages, catalog, settings, stats) and passed as props.
- Orders tab: **read-only** (stats + charts + CSV export). No refund, no status change, no
  order detail/edit, no manual fulfill/cancel.
- No RBAC, no audit log, no destructive-action confirmation patterns beyond `confirm()`,
  no separate admin routes per module (spec §56/§57 structure not present).
- Admin API surface is broader than the UI uses (customers route, wallet transaction,
  settings) — fine, but there is no permission layer between them.

## 16. Localization

- **Two parallel systems**: (a) next-intl (`messages/ar.json`, `messages/en.json`, 214 keys
  each) via `NextIntlClientProvider`; (b) inline `{ ar: "...", en: "..." }` objects rendered
  through `LocalizedText`/`text()` helpers (`components/site-preferences.tsx`) — used in
  **most** storefront components.
- Locale: cookie `NEXT_LOCALE` + `accept-language` in middleware (no URL prefix), default `ar`,
  `html dir` flips rtl/ltr.
- Product/business content is **Arabic-only** (no EN fields, no translations table) → the
  English locale shows Arabic product data.
- `NEXT_INTL_ENABLED` / `SUPPORTED_LOCALES` env flags exist in `.env.example` but are read
  nowhere (i18n.ts hardcodes locales) — dead config.

## 17. SEO

- `generateMetadata` on layout + product pages; canonical present; JSON-LD components
  (`components/seo/json-ld.tsx` — product schema etc.).
- **Missing**: `app/sitemap.ts`, `app/robots.ts` (middleware even lists them as static paths),
  `hreflang`/alternates, blog article schema verification **NOT VERIFIED** in depth.
- `/admin`, `/purchases`, `/checkout` get no `noindex` metadata (admin gets `X-Robots-Tag`
  from middleware; checkout/thank-you are public 200 pages with metadata).

## 18. Analytics / monitoring

- **Sentry is not integrated**: `@sentry/nextjs` is a dependency and `sentry.client.config.ts`
  + `lib/monitoring.ts` exist, but `next.config.mjs` does **not** wrap with `withSentry`, and
  nothing imports `lib/monitoring.ts` from the app. `instrumentation.ts` is an explicit no-op
  ("Telegram alerting removed"). Errors go to `console.error` + `report-caught-error.ts`
  (which calls Sentry only if a DSN is present — and the server-side init never runs because
  there is no withSentry hook).
- No `/api/health` endpoints. No structured logging (console with ad-hoc objects).
- No request-id propagation.

## 19. Testing

- Vitest + jsdom, 5 unit test files, **28 tests, all passing** (verified). Coverage:
  `tests/{admin-auth,bundle-discounts,csrf,honeypot,refresh-token-rotation}.test.ts` — pure
  functions only.
- **No integration tests** despite CI standing up a Postgres service (the service is
  unused by any test). No E2E (no Playwright config; CI has no e2e job). No Playwright at all.
- Coverage thresholds configured (60/60/55/60) — will fail CI if real coverage dips; currently
  green because only `lib/**` is included and the pure libs are well covered.
- One test file triggers a real PrismaClient engine load (unhandled rejection in this sandbox;
  in CI the native engine + DB make it pass) — tests should mock the DB boundary.
- CI (`.github/workflows/ci.yml`): lint+typecheck (dummy secrets), test (postgres service),
  build, lighthouse (PR only) — **`.lighthouserc.json` is missing**, so the lighthouse job
  fails on every PR.

## 20. Deployment

- Target: Vercel + Neon PostgreSQL + Cloudinary (per docs). `vercel.json` has a 09:00 cron.
- Constraints handled: images from Cloudinary allowed; security headers; HSTS in prod.
- Not handled: durable local storage (uploads fall back to `public/uploads`/`storage/uploads`
  which do not persist on Vercel — checkout readiness refuses local files when `VERCEL=1`,
  which is correct but means **local uploads are a dev-only mode**); 5GB upload body;
  in-process rate limits; no Sentry; no health checks for Vercel.
- `next.config.mjs`: `serverActions.bodySizeLimit = 100mb` (for admin Server Actions? none are
  used — dead config).

## 21. Environment variables (as used in code, verified)

| Variable | Where used | Required? | Problem |
|---|---|---|---|
| `DATABASE_URL` | prisma, db.ts | prod | — |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | auth.config, csrf | prod | dev-placeholder fallback chain |
| `ADMIN_SESSION_SECRET` | admin-auth, admin cookie | prod | also used as AUTH_SECRET fallback (role confusion) |
| `AUTH_GOOGLE_ID/SECRET` **or** `GOOGLE_CLIENT_ID/SECRET` | auth.config (both names!) | opt | **two name pairs for the same thing**; `GOOGLE_CLIENT_ID` also used by Drive |
| `ADMIN_EMAIL` | seed, admin-credentials | prod | — |
| `ADMIN_PASSWORD` | seed + runtime fallback | — | name 1 |
| `ADMIN_BOOTSTRAP_PASSWORD` | admin-credentials-bcrypt | — | name 2 (documented in .env.example) |
| `ADMIN_PASSWORD_HASH` | seed | — | name 3 |
| `STRIPE_SECRET_KEY`, `STRIPE_CURRENCY`, `STRIPE_WEBHOOK_SECRET` | payments / **nowhere** | prod | webhook secret unused (no webhook) |
| `PAYPAL_ENV`, `NEXT_PUBLIC_PAYPAL_ENV`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `NEXT_PUBLIC_PAYPAL_CURRENCY` | payments | prod | — |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | cloudinary.ts | prod | — |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | mailer | prod | — |
| `NEXT_PUBLIC_SITE_URL`, `AUTH_URL` | site-url | prod | — |
| `GOOGLE_CLIENT_ID/SECRET`, `GOOGLE_TOKEN_ENCRYPTION_KEY` | google-drive | opt | collides with customer OAuth naming |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | security/turnstile | opt | — |
| `CRON_SECRET` | cron route | **should be prod** | endpoint open when missing |
| `SENTRY_DSN` etc. | monitoring.ts (unwired) | — | dead until wired |
| `NEXT_INTL_ENABLED`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE` | **nowhere** | — | dead config |
| `FEATURE_ABANDONED_CART_REMINDERS`, `FEATURE_UPSELL`, `FEATURE_BUNDLES` | **nowhere** (feature flags read by no code) | — | dead config |

No `lib/env.ts`; every module reads `process.env` directly (inconsistent names, no startup
validation, secrets can be logged by `report-caught-error` if included in error context).

## 22. Known bugs (verified)

| ID | Severity | Bug | Evidence |
|---|---|---|---|
| B1 | P0 | Fresh-DB `migrate deploy` fails (voucher constraint before table) | reproduced on PG 18 |
| B2 | P0 | Schema/migration drift: 8 columns + 2 tables missing from migrations | reproduced; seed/checkout crashed until manually patched |
| B3 | P0 | Unauthenticated `/api/paypal/capture-order` (IDOR, can capture others' pending payments) | code + unauth probe |
| B4 | P0 | No checkout idempotency → duplicate orders (double-charge path) | reproduced (2 parallel POSTs → 2 orders) |
| B5 | P0 | Paid files stored as public Cloudinary assets | code (`uploadToCloudinary` default type) |
| B6 | P0 | No Stripe webhook; return-URL GET is the only confirmation + fulfillment | code (no route), runtime |
| B7 | P1 | `isTrustedOrigin` always true with Origin/Referer → origin check useless | code |
| B8 | P1 | DB outage → storefront silently returns 200 with empty catalog (no error state) | reproduced (stopped PG, GET /products → 200, no products) |
| B9 | P1 | Bundles broken: bundle id added as product → checkout 500; `/bundles/[slug]` 404; DB bundles ignored by pricing | code |
| B10 | P1 | Voucher maxUses race; wallet capture race (duplicate ledger rows) | code |
| B11 | P1 | Fulfillment side-effects swallowed by `.catch(() => null)` in 3 places | code |
| B12 | P1 | Cron abandoned-carts open without `CRON_SECRET` | code |
| B13 | P1 | Seeded products have no files → all seeded checkouts blocked | reproduced (400 Arabic message) |
| B14 | P1 | In-memory rate limiting ineffective on serverless | code |
| B15 | P2 | `devCode` in admin login response in dev mode | code (intended, needs guard) |
| B16 | P2 | Homepage fake stats (`\|\| 3`, `5GB+`) | code |
| B17 | P2 | Dead/duplicated code: `lib/order-access.ts` vs `lib/download-token.ts` (same cookie const, 2 TTLs); `lib/bundle-system` vs `lib/bundle-discounts`; `route.ts.new`; `request-link` stub; `FEATURE_*`/`NEXT_INTL_ENABLED` env flags unread; `monitoring.ts` unwired | code |
| B18 | P2 | CI lighthouse job broken (missing `.lighthouserc.json`) | code |
| B19 | P2 | 88MB Windows Node distribution (`nod/`), 2.4MB `tsconfig.tsbuildinfo`, empty `build_*.txt` ×8, `*.reference` ×7, `package.json.additions.json`, `runbuild.bat`, `check-files.js`, `.kilo/` plans committed to Git | `git ls-files` |
| B20 | P2 | Two lockfiles: `package-lock.json` (used by CI) + `pnpm-lock.yaml` + `pnpm-workspace.yaml` (with placeholder values) | repo root |

## 23. Technical debt summary (phase mapping)

- **P0 (blocks production)**: B1–B7, plus: single source of pricing, order state machine,
  webhook architecture, env validation, private storage for paid assets.
- **P1**: admin module split + RBAC + audit log + refunds; product/Grade/Subject relations +
  ProductTranslation; product publish validation; DB error states (no silent empty); storage
  abstraction (`DigitalAsset`) + signed URLs; health checks; Sentry wiring; localization
  unification; real rate limiting (edge/Upstash); checkout idempotency key; bundle
  decision (fix or remove); content rewrite per style guide; sitemap/robots/hreflang.
- **P2**: repo cleanup (artifacts, one lockfile, npm-only), CI lighthouse fix, dead code
  removal, dead env removal, seed hygiene (non-destructive dev seed with files), performance
  (no force-dynamic blanket; targeted selects; no full-file fetch in readiness), E2E suite.

## 24. Sandbox-only changes (NOT to be shipped as-is)

These were made **only** to run the app inside this restricted sandbox
(`binaries.prisma.sh` unreachable). They must be reviewed/reverted as part of Phase 1:

1. `lib/db.ts` — temporary conditional `@prisma/adapter-pg` driver adapter behind
   `KUTUBI_PG_ADAPTER=1` (production behavior unchanged when the flag is unset).
   *Decision needed in Phase 2*: adopting the driver-adapter + WASM query-compiler client is
   actually a reasonable Vercel posture (no native engine binaries), but it is a real
   architecture change and should be done deliberately with an ADR, not left as a patch.
2. `@prisma/adapter-pg` added to `package.json` (temporary, see above).
3. `.env` (gitignored) with local test values.
4. `.local-engines/` stub engine files (gitignored dir) used only for `prisma generate`/`validate`
   version checks in the sandbox.
5. Local test PostgreSQL 18 (embedded) at `/home/user/pg-local` with a `kutubi_dev` database
   built from the real migrations (+ manual drift fixes that **belong in a new migration**).
6. `storage/uploads/audit-test.pdf` test fixture (gitignored path).

## 25. Verified status at audit time

```
npm install ......... OK (sandbox: prisma engine binaries stubbed)
npm run build ....... PASS
npx tsc --noEmit .... PASS
npx eslint . ........ 0 errors / 47 warnings
npx vitest run ...... 28/28 pass (5 files; 1 unhandled rejection from real Prisma load)
migrate on fresh PG . FAILS (B1) until reordered; then drift appears (B2)
App runtime smoke ... homepage/products/product-page render DB data (200)
                      /admin → 307 (gate) ; /purchases → 307 (gate)
                      unauth APIs → 401/403 as designed (wallet, purchases, download)
                      admin login→OTP→verify→session works; admin API 401 without session
                      checkout: readiness block works; Stripe-unconfigured → 500 + order failed
                      duplicate checkout → duplicate orders (B4)
                      DB down → silent empty 200 (B8)
NOT VERIFIED in sandbox:
  - Stripe/PayPal real payment flows (no provider creds; needs sandbox keys + webhook tests)
  - Google OAuth login (no Google creds)
  - Vercel deployment behavior (rate limits, disk ephemerality, cron)
  - Lighthouse/real-browser responsive QA
  - Mobile/RTL visual QA
```
