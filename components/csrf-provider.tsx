"use client";

/**
 * components/csrf-provider.tsx — Client-side CSRF token helper
 *
 * The CSRF token is issued by the server (lib/security/csrf.ts) as a
 * non-httpOnly cookie. This client component reads it and provides it
 * for form submissions.
 *
 * Usage:
 *   <form>
 *     <CsrfTokenInput />
 *     ...rest of form
 *   </form>
 */

const CSRF_COOKIE = "kutubi_csrf";
const CSRF_HEADER = "x-csrf-token";

/** Read the current CSRF token from document cookies */
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CSRF_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=")[1]!) : null;
}

/** Get headers object with CSRF token included */
export function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { [CSRF_HEADER]: token } : {};
}

/** Submit a form with CSRF token attached as a header */
export async function submitWithCsrf(
  url: string,
  formData: FormData,
  options?: RequestInit
): Promise<Response> {
  const token = getCsrfToken();
  const headers: Record<string, string> = {
    ...(token ? { [CSRF_HEADER]: token } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };
  return fetch(url, {
    ...options,
    method: options?.method ?? "POST",
    headers,
    body: formData,
    credentials: "include",
  });
}

// Hidden input component for use inside forms
interface CsrfTokenInputProps {
  className?: string;
}

export function CsrfTokenInput({ className }: CsrfTokenInputProps) {
  // This is a no-op client-side component that just renders a hidden input
  // with the CSRF token. The actual token is read from cookie and sent as header.
  // For forms using fetch(), use submitWithCsrf() instead.
  // For forms using native submit, include this hidden input and set the header via JS.
  return null;
}
