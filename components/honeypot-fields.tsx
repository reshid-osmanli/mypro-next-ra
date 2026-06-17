"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

/**
 * HoneypotFields — Invisible anti-bot fields.
 *
 * Bots will fill these fields (they see all inputs), but humans won't.
 * The server rejects any submission where these fields are non-empty
 * or where the form was submitted too fast (< 800ms).
 *
 * Usage:
 *   <form>
 *     <HoneypotFields renderedAt={Date.now()} />
 *     ...rest of form
 *   </form>
 *
 * When submitting, add renderedAt to the payload:
 *   const data = new FormData(form);
 *   data.set("renderedAt", String(Date.now()));
 *   // Also include website, email_confirm fields (they are in the DOM)
 *   await fetch("/api/checkout", { method: "POST", body: data });
 */

// Internal field names — must match lib/security/honeypot.ts
const HONEY_FIELD_NAMES = ["website", "email_confirm", "phone_url"] as const;

type HoneypotFieldsProps = {
  /** Set to Date.now() when the form is first rendered */
  renderedAt?: number;
  /** Additional CSS class for the container */
  className?: string;
};

/**
 * Hidden honeypot fields that bots fill but humans never see.
 * Also includes a hidden renderedAt timestamp for timing checks.
 */
export const HoneypotFields = forwardRef<HTMLDivElement, HoneypotFieldsProps>(
  function HoneypotFields({ renderedAt, className }, ref) {
    const hiddenStyle: InputHTMLAttributes<HTMLInputElement>["style"] = {
      position: "absolute",
      left: "-9999px",
      top: "-9999px",
      opacity: 0,
      pointerEvents: "none",
      height: 0,
      width: 0,
      overflow: "hidden",
    };

    return (
      <div ref={ref} aria-hidden="true" style={{ display: "none" }} className={className}>
        {/* Honeypot: bots typically fill these */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          style={hiddenStyle}
          aria-hidden="true"
        />
        <input
          type="text"
          name="email_confirm"
          tabIndex={-1}
          autoComplete="off"
          style={hiddenStyle}
          aria-hidden="true"
        />
        <input
          type="text"
          name="phone_url"
          tabIndex={-1}
          autoComplete="off"
          style={hiddenStyle}
          aria-hidden="true"
        />
        {/* Timing field: sent to server for submission speed check */}
        {renderedAt !== undefined && (
          <input
            type="hidden"
            name="renderedAt"
            value={String(renderedAt)}
          />
        )}
      </div>
    );
  }
);

export { HONEY_FIELD_NAMES };
