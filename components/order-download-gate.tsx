"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Download, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSitePreferences } from "@/components/site-preferences";
import { Button } from "@/components/ui/button";
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
  }, []);

  if (loading) {
    return (
      <div className="mt-6 flex items-center gap-2.5 rounded-sm border border-line bg-surface p-4 text-body-sm text-ink-soft">
        <Loader2 size={16} className="animate-spin text-brand" aria-hidden="true" />
        {text({ ar: "جاري تجهيز التنزيل الآمن...", en: "Preparing the secure download..." })}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 space-y-3">
        <div className="rounded-sm border border-accent-danger/30 bg-accent-danger-soft p-5 text-body-sm font-semibold text-accent-danger">
          {error}
        </div>
        <Button
          onClick={() => {
            setLoading(true);
            setError("");
            startedRef.current = false;
            void runDownload();
          }}
          variant="primary"
          size="md"
        >
          <RefreshCw size={15} aria-hidden="true" />
          {text({ ar: "لم يتم تنزيل الملف اضغط هنا لعمل التنزيل مرة أخرى", en: "Download did not start. Click here to retry." })}
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-8 rounded-sm border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-label font-bold text-brand-deep">{text({ ar: "تنزيل آمن", en: "Secure download" })}</p>
          <p className="mt-1 text-body-sm text-ink-soft">
            {completed
              ? text({ ar: "بدأ تنزيل الملف. سيتم الرجوع إلى الصفحة الرئيسية الآن.", en: "The download has started. Returning home now." })
              : text({ ar: "يبدأ التنزيل تلقائياً بدون إظهار رابط مباشر للملفات.", en: "The download starts automatically without exposing a direct file link." })}
          </p>
          {downloadName ? <p className="mt-2 inline-flex items-center gap-2 text-caption font-semibold text-ink"><Download size={14} aria-hidden="true" />{downloadName}</p> : null}
        </div>
        <span className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-accent-teal-soft px-3 text-caption font-semibold text-accent-teal">
          <ShieldCheck size={13} aria-hidden="true" /> {text({ ar: "مرة واحدة", en: "One time" })}
        </span>
      </div>
    </div>
  );
}
