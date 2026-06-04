"use client";

import "./globals.css";
import { useEffect } from "react";
import { reportReactError } from "@/components/telegram-error-reporter";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void reportReactError(error, "app/global-error");
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-white antialiased">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-bold text-zinc-950">خطأ في التطبيق</h1>
          <p className="text-sm leading-7 text-zinc-600">{error.message || "تعذر تشغيل التطبيق."}</p>
          <button type="button" onClick={() => reset()} className="btn-primary">
            إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  );
}
