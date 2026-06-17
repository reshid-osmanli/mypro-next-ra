# Kutubi — Production Hardening & Feature Implementation

> Master integration guide for all 10 work streams.
> Apply in the order suggested. Each step is independent and reversible.

---

## 📋 Quick Reference

| # | Stream | Files Affected | Risk Level | Effort |
|---|---|---|---|---|
| 1 | Security Hardening | `next.config.mjs`, `middleware.ts`, `lib/security/*`, prisma | 🟠 Medium | 2–3h |
| 2 | UX Improvements | New `components/*` files | 🟢 Low | 2–3h |
| 3 | Conversion (Bundles, Upsells) | Prisma + new components + API | 🟡 Medium | 3–4h |
| 4 | SEO (Schema, Meta) | New `lib/schema-markup.ts`, app routes | 🟢 Low | 2h |
| 5 | Marketing (Abandoned Cart, Affiliate) | New lib + cron improvements | 🟢 Low | 2–3h |
| 6 | Admin Dashboard | New charts + CSV | 🟢 Low | 2h |
| 7 | Code Quality | Configs + tests + CI | 🟠 Medium | 4–5h |
| 8 | Design Polish | `app/layout.tsx`, `globals.css` | 🟢 Low | 1h |
| 9 | i18n (next-intl) | New `messages/*`, `i18n.ts` | 🟠 Medium | 4–6h |
| 10 | Deploy & CI | `.env.example`, GitHub Actions | 🟢 Low | 2h |

---

## 🚀 Phase 1: Security Hardening (DO FIRST)

### 1.1 Replace `next.config.mjs`
```bash
cp 01-security/next.config.mjs /path/to/kutubi/next.config.mjs
```

### 1.2 Replace `middleware.ts`
```bash
cp 01-security/middleware.ts /path/to/kutubi/middleware.ts
```

### 1.3 Add Security Library Files
```bash
mkdir -p /path/to/kutubi/lib/security
cp 01-security/lib/csrf.ts          /path/to/kutubi/lib/security/
cp 01-security/lib/honeypot.ts      /path/to/kutubi/lib/security/
cp 01-security/lib/turnstile.ts     /path/to/kutubi/lib/security/
cp 01-security/lib/password-bcrypt.ts /path/to/kutubi/lib/security/
cp 01-security/lib/refresh-token-rotation.ts /path/to/kutubi/lib/security/
cp 01-security/lib/admin-credentials-bcrypt.ts /path/to/kutubi/lib/admin-credentials-bcrypt.ts
```

### 1.4 Install bcryptjs
```bash
npm install bcryptjs @types/bcryptjs
```

### 1.5 Replace `lib/admin-credentials.ts`
The existing version compares ADMIN_PASSWORD plaintext. Replace it with the bcrypt-only version:
```bash
cp 01-security/lib/admin-credentials-bcrypt.ts /path/to/kutubi/lib/admin-credentials.ts
```

### 1.6 Update Prisma schema
Add to `prisma/schema.prisma`:
```bash
cat 01-security/prisma/refresh-token-rotation.prisma >> /path/to/kutubi/prisma/schema.prisma
# Also add Bundle, BundleItem, UpsellRule from 03-conversion
cat 03-conversion/prisma/schema-bundles.prisma >> /path/to/kutubi/prisma/schema.prisma
```

Then run:
```bash
npx prisma migrate dev --name add_security_features
npx prisma generate
```

### 1.7 Replace `lib/report-caught-error.ts` with Sentry
```bash
cp 01-security/lib/monitoring.ts /path/to/kutubi/lib/monitoring.ts
# Update imports across the project: report-caught-error → monitoring
```

### 1.8 Add Sentry
```bash
npm install @sentry/nextjs
cp 01-security/instrumentation.ts /path/to/kutubi/instrumentation.ts
cp 01-security/sentry.client.config.ts /path/to/kutubi/sentry.client.config.ts
# Add `SENTRY_DSN` to .env
```

### 1.9 Update `.env`
Add to `.env`:
```env
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
TURNSTILE_SECRET_KEY=1x00000000000000000000AA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

### 1.10 Update Admin Login Routes
The admin login route at `app/api/admin/login/route.ts` must:
1. Use `verifyCsrfFromRequest()` or `assertCsrf()` for POST
2. Call `bootstrapAdminFromEnv()` once on startup

Add at the top of the login route:
```ts
import { assertCsrf } from "@/lib/security/csrf";
import { bootstrapAdminFromEnv } from "@/lib/admin-credentials";

// at the start of POST:
await bootstrapAdminFromEnv().catch(() => null);
await assertCsrf();
```

### 1.11 Update `lib/order-access.ts` and Checkout
The existing checkout at `app/api/checkout/route.ts` should call:
```ts
await assertCsrf();
```
at the start of the POST handler.

---

## 🎨 Phase 2: UX Improvements

### 2.1 Add New Components
```bash
mkdir -p /path/to/kutubi/components/skeletons /path/to/kutubi/components/empty-states
cp 02-ux/components/sticky-add-to-cart.tsx /path/to/kutubi/components/
cp 02-ux/components/confetti-celebration.tsx /path/to/kutubi/components/
cp 02-ux/components/breadcrumbs.tsx /path/to/kutubi/components/
cp 02-ux/components/page-transition.tsx /path/to/kutubi/components/
cp 02-ux/components/product-badges.tsx /path/to/kutubi/components/
cp 02-ux/components/skeletons/index.tsx /path/to/kutubi/components/skeletons/
cp 02-ux/components/empty-states/index.tsx /path/to/kutubi/components/empty-states/
```

### 2.2 Use in Existing Pages

**`app/products/[slug]/page.tsx`** — add at top of the return:
```tsx
import { StickyAddToCart } from "@/components/sticky-add-to-cart";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductBadges } from "@/components/product-badges";

// inside the component, before <Link href="/products">:
<Breadcrumbs items={[
  { href: "/", label: "الرئيسية" },
  { href: "/products", label: "المتجر" },
  { label: product.title },
]} />

// Inside the right column, replace the badge:
<ProductBadges product={product} />

// Add after the main grid:
<StickyAddToCart product={product} />
```

**`app/thank-you/page.tsx`** — add confetti:
```tsx
import { ConfettiCelebration } from "@/components/confetti-celebration";

// At the top of the return:
<ConfettiCelebration fire={Boolean(order)} />
```

### 2.3 Replace Empty States
Search for places with empty arrays and use:
```tsx
import { EmptyCart, EmptyProducts, EmptyReviews } from "@/components/empty-states";

{cart.length === 0 && <EmptyCart />}
```

---

## 💰 Phase 3: Conversion (Bundles, Upsells)

### 3.1 Prisma already has Bundle models from Phase 1.6

### 3.2 Add Bundle + Upsell Files
```bash
cp 03-conversion/lib/bundle-system.ts /path/to/kutubi/lib/
cp 03-conversion/lib/upsell-suggestions.ts /path/to/kutubi/lib/
cp 03-conversion/components/bundle-card.tsx /path/to/kutubi/components/
cp 03-conversion/components/upsell-suggestions.tsx /path/to/kutubi/components/
```

### 3.3 Create `/api/upsell` route
```bash
mkdir -p /path/to/kutubi/app/api/upsell
# Create route.ts:
cat > /path/to/kutubi/app/api/upsell/route.ts <<'EOF'
import { NextResponse } from "next/server";
import { getUpsellSuggestions } from "@/lib/upsell-suggestions";
import { assertCsrf } from "@/lib/security/csrf";

export async function POST(req: Request) {
  await assertCsrf();
  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body?.items) ? body.items : [];
  const suggestions = await getUpsellSuggestions(items);
  return NextResponse.json({ suggestions });
}
EOF
```

### 3.4 Use in Cart and Checkout
```tsx
import { UpsellSuggestions } from "@/components/upsell-suggestions";
// Add inside the cart page after the cart items list
<UpsellSuggestions />
```

---

## 🔍 Phase 4: SEO

### 4.1 Add Schema Library + Components
```bash
mkdir -p /path/to/kutubi/components/seo
cp 04-seo/lib/schema-markup.ts /path/to/kutubi/lib/
cp 04-seo/components/json-ld.tsx /path/to/kutubi/components/seo/
cp 04-seo/components/seo-head.tsx /path/to/kutubi/components/seo/
```

### 4.2 Use in Product Page
Update `app/products/[slug]/page.tsx`:
```tsx
import { buildProductSchema, buildReviewsSchema } from "@/lib/schema-markup";
import { JsonLd } from "@/components/seo/json-ld";

// Inside the component:
const schemas = [
  buildProductSchema({
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    price: product.price,
    compareAt: product.compareAt,
    coverImage: product.coverImage,
    images: product.additionalImages ?? [],
    averageRating: product.averageRating,
    reviewCount: product.reviewCount,
  }),
  ...(reviews.length ? [buildReviewsSchema({
    productSlug: product.slug,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      author: r.customerName ?? undefined,
      createdAt: r.createdAt,
    })),
  })] : []),
];

// Replace the existing <script type="application/ld+json"> with:
<JsonLd id="product" data={schemas} />
```

### 4.3 Improve Blog SEO
The blog at `app/blog/[slug]/page.tsx` already exists. Add:
```tsx
import { buildBlogPostSchema } from "@/lib/schema-markup";
// Inside the page:
{post && <JsonLd id="blog-post" data={buildBlogPostSchema({
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  body: post.body,
  coverImage: post.coverImage,
  createdAt: post.createdAt,
  updatedAt: post.createdAt,
})} />}
```

---

## 📧 Phase 5: Marketing

### 5.1 Abandoned Cart
```bash
mkdir -p /path/to/kutubi/lib/emails
cp 05-marketing/lib/abandoned-cart-improved.ts /path/to/kutubi/lib/abandoned-cart-improved.ts
cp 05-marketing/emails/abandoned-cart-template.ts /path/to/kutubi/lib/emails/
cp 05-marketing/components/affiliate-dashboard.tsx /path/to/kutubi/components/
```

### 5.2 Update Cron Route
The existing `/app/api/cron/abandoned-carts/route.ts` should now use the new lib:
```ts
import { getCartsReadyForReminder, markReminderSent } from "@/lib/abandoned-cart-improved";
import { sendSecurityEmail } from "@/lib/mailer";
import { buildAbandonedCartEmail } from "@/lib/emails/abandoned-cart-template";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const reminders = await getCartsReadyForReminder();
  let sent = 0;
  for (const r of reminders) {
    const cart = await prisma.abandonedCart.findUnique({ where: { id: r.cartId } });
    if (!cart) continue;
    const items = JSON.parse(cart.itemsJson) as Array<{ id: string; title: string; price: number; quantity: number }>;
    const resumeUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/cart?resume=${cart.id}`;
    const email = buildAbandonedCartEmail({
      email: cart.email,
      customerName: cart.customerName,
      items,
      subtotal: cart.subtotal,
      couponCode: r.couponCode,
      discountPercent: r.reminderType === "second" ? 5 : r.reminderType === "third" ? 10 : 0,
      resumeUrl,
      type: r.reminderType as any,
    });
    await sendSecurityEmail({ to: cart.email, subject: email.subject, html: email.html, text: email.text });
    await markReminderSent(cart.id);
    sent++;
  }
  return Response.json({ ok: true, sent });
}
```

### 5.3 Use Affiliate Dashboard
Replace `app/affiliates/page.tsx` body with `<AffiliateDashboard {...stats} />`

---

## 📊 Phase 6: Admin Dashboard

### 6.1 Add Chart Components
```bash
cp 06-admin/components/admin-charts.tsx /path/to/kutubi/components/
cp 06-admin/lib/csv-export.ts /path/to/kutubi/lib/
cp 06-admin/api-orders-export.ts /path/to/kutubi/app/api/admin/orders/export/route.ts
```

### 6.2 Use Charts in Dashboard
In `components/admin-dashboard.tsx`, add inside the dashboard tab:
```tsx
import { SalesBarChart, SalesLineChart, ConversionRateCard, TopProductsList } from "@/components/admin-charts";

<div className="grid gap-4 md:grid-cols-3">
  <SalesBarChart data={adminStats.salesSeries.daily} title="المبيعات اليومية" />
  <SalesLineChart data={adminStats.salesSeries.monthly} title="المبيعات الشهرية" />
  <ConversionRateCard paid={adminStats.totals.paidOrders} total={adminStats.totals.orders} />
</div>
<TopProductsList items={adminStats.topProducts} />
```

---

## 🧪 Phase 7: Code Quality

### 7.1 Install Test Tools
```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom @types/bcryptjs
```

### 7.2 Add Vitest Config
```bash
cp 07-quality/vitest/vitest.config.ts /path/to/kutubi/vitest.config.ts
cp 07-quality/vitest/vitest.setup.ts /path/to/kutubi/vitest.setup.ts
```

### 7.3 Add Tests
```bash
mkdir -p /path/to/kutubi/tests
cp 07-quality/tests/*.test.ts /path/to/kutubi/tests/
```

### 7.4 Update tsconfig
```bash
cp 07-quality/tsconfig.json /path/to/kutubi/tsconfig.json
# Fix any type errors with:
npx tsc --noEmit
```

### 7.5 Add ESLint Security
```bash
npm install -D eslint-plugin-security eslint-plugin-import
cp 07-quality/.eslintrc.security.json /path/to/kutubi/.eslintrc.security.json
# Merge into your existing .eslintrc.json
```

### 7.6 Add CI/CD
```bash
mkdir -p /path/to/kutubi/.github/workflows
cp 07-quality/.github/workflows/ci.yml /path/to/kutubi/.github/workflows/
```

### 7.7 Add Storybook (Optional)
```bash
npm install -D @storybook/nextjs @storybook/addon-essentials @storybook/addon-links @storybook/addon-a11y @storybook/addon-themes
mkdir -p /path/to/kutubi/.storybook
cp 07-quality/.storybook/*.ts /path/to/kutubi/.storybook/
cp 07-quality/.storybook/button.stories.tsx /path/to/kutubi/.storybook/
```

### 7.8 Add Husky (Optional)
```bash
npm install -D husky lint-staged
npx husky init
# Add .husky/pre-commit:
#   npx lint-staged
```

---

## 🎯 Phase 8: Design Polish

### 8.1 Replace Layout
```bash
cp 08-design/app-layout-fonts.tsx /path/to/kutubi/app/layout.tsx
```

### 8.2 Replace Globals CSS
```bash
cp 08-design/globals.css /path/to/kutubi/app/globals.css
```

### 8.3 Test Locally
```bash
npm run dev
# Check: Cairo font loaded, radius consistent, focus rings visible
```

---

## 🌍 Phase 9: i18n (Optional — Major Refactor)

If you want to fully migrate to next-intl:

### 9.1 Install
```bash
npm install next-intl
```

### 9.2 Add Files
```bash
mkdir -p /path/to/kutubi/messages
cp 09-i18n/lib/i18n.ts /path/to/kutubi/i18n.ts
cp 09-i18n/messages/ar.json /path/to/kutubi/messages/
cp 09-i18n/messages/en.json /path/to/kutubi/messages/
```

### 9.3 Update Middleware
Merge `09-i18n/lib/middleware-i18n.ts` with the security middleware.

### 9.4 Refactor Components
Replace `text({ ar, en })` calls with `t("key")` from `useTranslations`.
This is a multi-file refactor — do it gradually per page.

> ⚠️ The current code uses inline `{ar, en}` objects in ~30 components. A full migration is recommended but takes 1–2 days. The migration is purely additive (you can keep both systems).

---

## 🚢 Phase 10: Deploy

### 10.1 Update `.env.example`
```bash
cp 10-deploy/env.example /path/to/kutubi/.env.example
```

### 10.2 Add to Vercel
In Vercel dashboard → Settings → Environment Variables, add:
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`
- `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `CRON_SECRET`
- (existing variables stay)

### 10.3 Configure Vercel Cron
In `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/abandoned-carts", "schedule": "0 */6 * * *" }
  ]
}
```

### 10.4 First Admin Bootstrap
Set `ADMIN_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` (12+ chars) **once** in Vercel.
On first request to `/admin/login`, the admin user will be created with bcrypt hash.
**Then rotate `ADMIN_BOOTSTRAP_PASSWORD` and remove it from env** — it won't be used again.

### 10.5 Verify
After deploy:
- [ ] Visit `/admin/login` and confirm login still works
- [ ] Check Sentry receives an event (visit `/api/sentry-debug` after creating it)
- [ ] Test signup with Turnstile widget visible
- [ ] Test checkout: POST should be blocked without CSRF token
- [ ] Run Lighthouse on key pages — target ≥ 90 score

---

## ✅ Final Verification Checklist

After applying everything:

- [ ] `npm run typecheck` — passes
- [ ] `npm run lint` — no errors
- [ ] `npm run test` — all tests pass
- [ ] `npm run build` — succeeds
- [ ] Try CSRF attack: `curl -X POST /api/checkout` without CSRF header → 403
- [ ] Submit form with honeypot field filled → rejected
- [ ] Submit form in <800ms → rejected
- [ ] Refresh `/thank-you` → confetti does NOT replay
- [ ] Visit product page → sticky CTA appears after scroll
- [ ] Add 3+ items to cart → bundle discount applies
- [ ] View source on product page → JSON-LD Product + BreadcrumbList schemas present
- [ ] Google Rich Results test passes for `/products/[slug]`
- [ ] Open `/admin` → charts render
- [ ] Export orders CSV with filters → file downloads correctly
- [ ] Bundle discount + Voucher + Wallet all combine in checkout

---

## 🆘 What Needs Manual Review After Merge

| Area | Why |
|---|---|
| CSP `connect-src` | Stripe + PayPal + Sentry URLs may need adjustment for your account |
| Cloudflare Turnstile keys | You must register your domain on Cloudflare and get real keys |
| Admin password rotation | After first bootstrap, rotate `ADMIN_BOOTSTRAP_PASSWORD` and remove |
| Database migration | Always backup DB before applying new Prisma migrations |
| Stripe webhook secret | Get from Stripe dashboard → Webhooks → Add endpoint |
| Bcrypt rounds | Currently 12 (good for Vercel hobby). Increase to 14 if using Pro |
| Sentry quota | Free tier is 5k events/month. Adjust sample rates if hitting limit |

---

## 📞 If You Hit Issues

1. **CSRF blocks legitimate requests**: Ensure all forms include `<input type="hidden" name="csrf" value={csrfToken} />` OR client-side fetches include the `X-CSRF-Token` header from the cookie. The middleware issues the cookie automatically.

2. **Admin login fails after migration**: Delete the old admin row from `AdminUser`, set `ADMIN_BOOTSTRAP_PASSWORD`, and trigger any admin endpoint once.

3. **Bundle schema migration fails**: Run `npx prisma migrate reset` then `npx prisma migrate deploy` (only in dev).

4. **Confetti doesn't render on `/thank-you`**: Check that `sessionStorage` isn't blocked (incognito blocks it — that's intentional).

5. **Tests fail locally**: Run `npx prisma migrate deploy` first; tests use a real test DB.

---

**Total effort: ~2–3 days of focused work** for a senior developer.
The result: a production-grade e-commerce platform ready for thousands of paying customers.
