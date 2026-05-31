# Kutubi

Arabic digital-products store built with Next.js, Prisma, PostgreSQL, PayPal/Stripe, Cloudinary uploads, optional Google Drive purchase sync, and a protected admin dashboard.

## Local Setup

```bash
npm install
copy .env.example .env
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open the app at:

```bash
http://localhost:3000
```

## Environment

Use `.env.example` as the safe template. Put the real values in `.env` locally and in Vercel Environment Variables. Do not commit real secrets.

Cloudinary is used for product files and cover images in hosted deployments. Google Drive sync is optional and requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and the callback URL shown in `VERCEL_ENVIRONMENT.md`.

## Database

The project uses PostgreSQL through Prisma:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Admin

Admin login path:

```bash
/admin/login
```

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` before running the site.

## Deployment

See `VERCEL_ENVIRONMENT.md` for the exact environment variable checklist and GitHub push steps.
