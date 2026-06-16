// ============================================================================
// lib/security/honeypot.ts — Server-side honeypot field validator
// ----------------------------------------------------------------------------
// New file: /lib/security/honeypot.ts
// Use to detect bots that fill hidden form fields.
// ============================================================================

const HONEYPOT_FIELDS = [
  "website",      // commonly filled by bots
  "phone_url",    // looks legit, but hidden
  "email_confirm",
];

const HONEYPOT_TIMING_MIN_MS = 800; // submitted in <800ms = bot

export type HoneypotInput = {
  fields?: Record<string, string | undefined>;
  renderedAt?: number; // timestamp the form was rendered (ms epoch)
};

export function isHoneypotTriggered(input: HoneypotInput): boolean {
  const fields = input.fields ?? {};
  for (const name of HONEYPOT_FIELDS) {
    const v = fields[name];
    if (v && v.trim().length > 0) return true;
  }
  return false;
}

export function isSubmittedTooFast(input: HoneypotInput): boolean {
  if (!input.renderedAt) return false;
  return Date.now() - input.renderedAt < HONEYPOT_TIMING_MIN_MS;
}

export async function verifyHoneypot(input: HoneypotInput): Promise<{ ok: boolean; reason?: string }> {
  if (isHoneypotTriggered(input)) {
    return { ok: false, reason: "honeypot_triggered" };
  }
  if (isSubmittedTooFast(input)) {
    return { ok: false, reason: "submitted_too_fast" };
  }
  return { ok: true };
}

/** Client-side hidden field renderer. */
export function HoneypotFields() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
      <label>
        Website (do not fill)
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label>
        Confirm email (do not fill)
        <input type="email" name="email_confirm" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
