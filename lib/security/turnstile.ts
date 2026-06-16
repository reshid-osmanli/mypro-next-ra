// ============================================================================
// lib/security/turnstile.ts — Cloudflare Turnstile verification
// ----------------------------------------------------------------------------
// New file: /lib/security/turnstile.ts
// Verifies Turnstile tokens server-side before processing sensitive forms.
// ============================================================================

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type VerifyResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
};

export async function verifyTurnstile(
  token: string | undefined,
  expectedAction?: string,
  remoteIp?: string
): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    // If Turnstile isn't configured, allow in dev but warn loudly
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "turnstile_not_configured" };
    }
    return { ok: true };
  }

  if (!token) return { ok: false, reason: "missing_token" };

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      // Cache must be disabled for security validation
      cache: "no-store",
    });

    if (!res.ok) return { ok: false, reason: `http_${res.status}` };

    const data = (await res.json()) as VerifyResponse;
    if (!data.success) {
      return { ok: false, reason: data["error-codes"]?.[0] ?? "verification_failed" };
    }

    if (expectedAction && data.action && data.action !== expectedAction) {
      return { ok: false, reason: "action_mismatch" };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, reason: "network_error" };
  }
}
