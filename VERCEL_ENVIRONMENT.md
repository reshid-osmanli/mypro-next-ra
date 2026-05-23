# Vercel Environment Checklist

Use this file as the deployment checklist. Keep the real secret values only in `.env` locally and in Vercel Project Settings.

## Required Variables

Add these variables in Vercel under:

`Project Settings -> Environment Variables`

```env
DATABASE_URL
NEXT_PUBLIC_SITE_URL
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
RESEND_API_KEY
RESEND_FROM_EMAIL
PAYPAL_ENV
NEXT_PUBLIC_PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
NEXT_PUBLIC_PAYPAL_CURRENCY
```

## Current Intended Values

- `DATABASE_URL`: Neon PostgreSQL connection string with SSL required.
- `NEXT_PUBLIC_SITE_URL`: Vercel production URL.
- `ADMIN_EMAIL`: admin email address.
- `ADMIN_PASSWORD`: admin password.
- `ADMIN_SESSION_SECRET`: long private session secret.
- `RESEND_API_KEY`: Resend API key.
- `RESEND_FROM_EMAIL`: sender email configured in Resend.
- `PAYPAL_ENV`: `sandbox` while testing.
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`: PayPal public client id.
- `PAYPAL_CLIENT_SECRET`: PayPal private secret.
- `NEXT_PUBLIC_PAYPAL_CURRENCY`: `USD`.

## Build Settings

Use the default Vercel settings for a Next.js app:

```bash
npm install
npm run build
```

The build command already runs Prisma Client generation through `package.json`.

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
