"use client";

import { useEffect } from "react";

export default function Error({
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
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-ink">حدث خطأ غير متوقع</h1>
      <p className="text-body-sm leading-8 text-ink-soft">{error.message || "تعذر تحميل هذه الصفحة."}</p>
      <button type="button" onClick={() => reset()} className="btn-primary">
        إعادة المحاولة
      </button>
    </main>
  );
}
