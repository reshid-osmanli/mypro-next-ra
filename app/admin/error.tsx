"use client";

import { useEffect } from "react";
import { reportReactError } from "@/components/telegram-error-reporter";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void reportReactError(error, "admin/error");
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-zinc-950">خطأ في لوحة الإدارة</h1>
      <p className="text-sm leading-7 text-zinc-600">{error.message || "تعذر تحميل هذه الصفحة الإدارية."}</p>
      <button type="button" onClick={() => reset()} className="btn-primary">
        إعادة المحاولة
      </button>
    </main>
  );
}
