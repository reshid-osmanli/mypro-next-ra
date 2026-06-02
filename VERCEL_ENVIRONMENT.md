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
NEXT_PUBLIC_PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
NEXT_PUBLIC_PAYPAL_CURRENCY
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
- `AUTH_URL`: the same production origin used by Auth.js, for example `https://your-vercel-domain.vercel.app`.
- `ADMIN_EMAIL`: admin email address.
- `ADMIN_PASSWORD`: admin password.
- `ADMIN_SESSION_SECRET`: long private session secret.
- `AUTH_SECRET`: long private Auth.js secret.
- `AUTH_GOOGLE_ID`: Google OAuth client id used by `/login` and `/signup`.
- `AUTH_GOOGLE_SECRET`: Google OAuth client secret used by `/login` and `/signup`.
- `RESEND_API_KEY`: Resend API key.
- `RESEND_FROM_EMAIL`: sender email configured in Resend.
- `PAYPAL_ENV`: `sandbox` while testing.
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`: PayPal public client id.
- `PAYPAL_CLIENT_SECRET`: PayPal private secret.
- `NEXT_PUBLIC_PAYPAL_CURRENCY`: `USD`.
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
