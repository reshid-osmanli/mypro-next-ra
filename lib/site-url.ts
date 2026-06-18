/**
 * Canonical public site URL for OAuth callbacks, Stripe return URLs, and origin checks.
 * Prefer AUTH_URL, then NEXT_PUBLIC_SITE_URL, then VERCEL_URL on deployments.
 */
export function resolveSiteUrl(): string | null {
  const authUrl = process.env.AUTH_URL?.trim();
  if (authUrl) return authUrl.replace(/\/$/, "");

  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (publicUrl) return publicUrl.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return null;
}

export function resolveSiteOrigin(): string | null {
  const siteUrl = resolveSiteUrl();
  if (!siteUrl) return null;
  try {
    return new URL(siteUrl).origin;
  } catch {
    return null;
  }
}

export function googleSignInRedirectUri() {
  const siteUrl = resolveSiteUrl();
  return siteUrl ? `${siteUrl}/api/auth/callback/google` : null;
}
