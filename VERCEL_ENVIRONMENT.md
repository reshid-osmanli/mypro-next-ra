# Vercel Environment Checklist

Use this file as the deployment checklist. Keep the real secret values only in `.env` locally and in Vercel Project Settings.

## Required Variables

Add these variables in Vercel under:

`Project Settings -> Environment Variables`

```env
DATABASE_URL
NEXT_PUBLIC_SITE_URL
AUTH_URL
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
RESEND_API_KEY
RESEND_FROM_EMAIL
PAYPAL_ENV
NEXT_PUBLIC_PAYPAL_ENV
NEXT_PUBLIC_PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
NEXT_PUBLIC_PAYPAL_CURRENCY
STRIPE_SECRET_KEY
STRIPE_CURRENCY
NEXT_PUBLIC_STRIPE_CURRENCY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_TOKEN_ENCRYPTION_KEY
```

## Current Intended Values

- `DATABASE_URL`: Neon PostgreSQL connection string with SSL required.
- `NEXT_PUBLIC_SITE_URL`: Vercel production URL.
- `AUTH_URL`: must exactly match your live site origin (no trailing slash), for example `https://your-vercel-domain.vercel.app`. If this differs from the real domain, Google login fails with `pkceCodeVerifier` errors.
- `ADMIN_EMAIL`: admin email address.
- `ADMIN_PASSWORD`: admin password.
- `ADMIN_SESSION_SECRET`: long private session secret.
- `AUTH_SECRET`: long private Auth.js secret.
- `AUTH_GOOGLE_ID`: Google OAuth client id used by `/login` and `/signup`.
- `AUTH_GOOGLE_SECRET`: Google OAuth client secret used by `/login` and `/signup`.
- `RESEND_API_KEY`: Resend API key.
- `RESEND_FROM_EMAIL`: sender email configured in Resend.
- `PAYPAL_ENV`: `sandbox` while testing.
- `NEXT_PUBLIC_PAYPAL_ENV`: `sandbox` while testing, `live` in production. Must match `PAYPAL_ENV` so the PayPal JS SDK and server API use the same environment.
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`: PayPal public client id.
- `PAYPAL_CLIENT_SECRET`: PayPal private secret.
- `NEXT_PUBLIC_PAYPAL_CURRENCY`: `USD`.
- `STRIPE_SECRET_KEY`: Stripe secret key. Keep server-side only.
- `STRIPE_CURRENCY`: lowercase Stripe currency, for example `usd`.
- `NEXT_PUBLIC_STRIPE_CURRENCY`: storefront currency label, for example `USD`.
- `CLOUDINARY_CLOUD_NAME`: Cloudinary product environment cloud name from Console API Keys.
- `CLOUDINARY_API_KEY`: Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Cloudinary API secret. Keep server-side only.
- `GOOGLE_CLIENT_ID`: Google OAuth client id for optional Drive sync.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret for optional Drive sync.
- `GOOGLE_TOKEN_ENCRYPTION_KEY`: long random secret used to encrypt stored Google refresh tokens.

For Auth.js Google login, add this authorized redirect URI in Google Cloud Console:

```text
https://your-vercel-domain.vercel.app/api/auth/callback/google
```

On Vercel, product files and cover images must use Cloudinary. Local folders such as `public/uploads` and `storage/uploads` are only for development and are not durable on serverless hosting.

For Google Drive OAuth, add this authorized redirect URI in Google Cloud Console:

```text
https://your-vercel-domain.vercel.app/api/purchases/drive/callback
```

## Build Settings

Use the default Vercel settings for a Next.js app:

```bash
npm install
npm run build
```

The build command already runs Prisma Client generation through `package.json`.
Run migrations after deployment setup or from the project folder:

```bash
npx prisma migrate deploy
```

## GitHub Push Steps

Run these commands from the project folder:

```bash
git status
git add prisma/schema.prisma components/product-visual.tsx components/product-card.tsx components/product-explorer.tsx app/products/[slug]/page.tsx .gitignore README.md .env.example VERCEL_ENVIRONMENT.md public/uploads/kutubi-popup-test.png
git commit -m "Switch to PostgreSQL and update product image preview"
git branch -M main
git remote -v
git push origin main
```

If `origin` is not configured yet:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Do not run `git add .env`; real secrets must stay out of GitHub.


## Public Site vs Admin Protection

The app code protects only private user/admin areas. Public storefront pages such as `/`, `/products`, `/library`, and content pages are not blocked by app middleware.

If the whole site asks visitors to sign in with the Vercel account email, that is deployment-level protection outside this repository. Disable Vercel Authentication / Deployment Protection for the public production deployment, and keep `/admin` protected by the app admin login.

Private routes kept protected in code:

- `/admin` and `/admin/*` through the admin session guard.
- `/purchases` and purchase/Drive APIs through Google login, because they expose a user’s private purchases.

After changing Vercel project protection settings, redeploy the production deployment and test from an incognito browser that is not signed in to Vercel.
