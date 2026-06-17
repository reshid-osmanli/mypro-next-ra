"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Download, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSitePreferences } from "./site-preferences";
import { useCart } from "./cart-provider";

function safeDownloadName(name: string) {
  return name.replace(/[\\/:*?"<>|]+/g, "-") || "kutubi-download";
}

function filenameFromHeader(value: string | null) {
  if (!value) return "kutubi-download";

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function OrderDownloadGate() {
  const router = useRouter();
  const { text } = useSitePreferences();
  const { clearCart } = useCart();
  const startedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [downloadName, setDownloadName] = useState("");

  const runDownload = useCallback(async () => {
    try {
      const res = await fetch("/api/order/download-package", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || text({ ar: "تعذر تجهيز التنزيل", en: "Unable to prepare the download" }));
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error(text({ ar: "الملف فارغ أو تالف", en: "File is empty or corrupted" }));
      }

      const name = safeDownloadName(filenameFromHeader(res.headers.get("X-Kutubi-Download-Name")));
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = name;
      a.rel = "noreferrer noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

      clearCart();
      setDownloadName(name);
      setCompleted(true);
      window.setTimeout(() => router.replace("/"), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : text({ ar: "تعذر تجهيز التنزيل", en: "Unable to prepare the download" }));
    } finally {
      setLoading(false);
    }
  }, [clearCart, router, text]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void runDownload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="mt-6 rounded-lg border border-qatar-100 bg-white p-5 text-sm text-zinc-500">
        <span className="inline-flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-qatar-700" />
          {text({ ar: "جاري تجهيز التنزيل الآمن...", en: "Preparing the secure download..." })}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 space-y-3">
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error}
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setError("");
            startedRef.current = false;
            void runDownload();
          }}
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <RefreshCw size={16} />
          {text({ ar: "لم يتم تنزيل الملف اضغط هنا لعمل التنزيل مرة أخرى", en: "Download did not start. Click here to retry." })}
        </button>
      </div>
    )
  }

  return (
    <div className="mt-8 rounded-lg border border-qatar-100 bg-white p-5 text-right shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-qatar-700">{text({ ar: "تنزيل آمن", en: "Secure download" })}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {completed
              ? text({ ar: "بدأ تنزيل الملف. سيتم الرجوع إلى الصفحة الرئيسية الآن.", en: "The download has started. Returning home now." })
              : text({ ar: "يبدأ التنزيل تلقائياً بدون إظهار رابط مباشر للملفات.", en: "The download starts automatically without exposing a direct file link." })}
          </p>
          {downloadName ? <p className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-zinc-600"><Download size={14} />{downloadName}</p> : null}
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          <ShieldCheck size={14} /> {text({ ar: "مرة واحدة", en: "One time" })}
        </span>
      </div>
    </div>
  );
}
