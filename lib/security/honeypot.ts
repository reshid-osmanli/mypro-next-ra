// ============================================================================
// lib/security/honeypot.ts — Server-side honeypot field validator
// ============================================================================

const HONEYPOT_FIELDS = [
  "website",      // commonly filled by bots
  "phone_url",    // looks legit, but hidden
  "email_confirm",
];

const HONEYPOT_TIMING_MIN_MS = 800;

export type HoneypotInput = {
  fields?: Record<string, string | undefined>;
  renderedAt?: number;  // Optional: timestamp when form was first rendered
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
  if (input.renderedAt === undefined) return false;
  return Date.now() - input.renderedAt < HONEYPOT_TIMING_MIN_MS;
}

export async function verifyHoneypot(input: HoneypotInput): Promise<{ ok: boolean; reason?: string }> {
  if (isHoneypotTriggered(input)) return { ok: false, reason: "honeypot_triggered" };
  if (isSubmittedTooFast(input)) return { ok: false, reason: "submitted_too_fast" };
  return { ok: true };
}
