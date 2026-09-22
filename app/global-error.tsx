"use client";

import "./globals.css";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The error is captured and can be logged.
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-bold text-ink">خطأ في التطبيق</h1>
          <p className="text-body-sm leading-8 text-ink-soft">{error.message || "تعذر تشغيل التطبيق."}</p>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-11 items-center justify-center rounded-sm bg-brand px-6 text-sm font-semibold text-paper transition-colors duration-instant hover:bg-brand-deep"
          >
            إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  );
}
