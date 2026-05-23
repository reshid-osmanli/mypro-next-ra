"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, ShieldCheck } from "lucide-react";
import { useSitePreferences } from "./site-preferences";
import { useCart } from "./cart-provider";

type FileItem = {
  id: string;
  title: string;
  mimeType: string;
  size: number;
  productTitle: string;
  token: string;
};

function safeDownloadName(name: string) {
  return name.replace(/[\\/:*?"<>|]+/g, "-") || "download";
}

export function OrderDownloadGate() {
  const { text } = useSitePreferences();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);

  const downloadOne = async (file: FileItem) => {
    setError("");
    setDownloadingId(file.id);

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, token: file.token })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || text({ ar: "تعذر تنزيل الملف", en: "Unable to download the file" }));
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = safeDownloadName(file.title);
      a.rel = "noreferrer noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : text({ ar: "تعذر تنزيل الملف", en: "Unable to download the file" }));
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/order/issue-download-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || text({ ar: "تعذر تجهيز روابط التحميل", en: "Unable to prepare download links" }));
        if (cancelled) return;
        const nextFiles = (data.files ?? []) as FileItem[];
        setFiles(nextFiles);
        clearCart();
        if (nextFiles.length === 1) {
          setTimeout(() => {
            void downloadOne(nextFiles[0]);
          }, 500);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : text({ ar: "تعذر تجهيز روابط التحميل", en: "Unable to prepare download links" }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [text]);

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  if (loading) {
    return <div className="mt-6 rounded-lg border border-qatar-100 bg-white p-5 text-sm text-zinc-500">{text({ ar: "جارٍ تجهيز روابط التحميل الآمنة...", en: "Preparing secure download links..." })}</div>;
  }

  if (error && !files.length) {
    return <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>;
  }

  if (!files.length) {
    return <div className="mt-6 rounded-lg border border-dashed border-qatar-200 bg-qatar-50/30 p-5 text-sm text-zinc-600">{text({ ar: "لا توجد ملفات مرفقة لهذا الطلب.", en: "No files are attached to this order." })}</div>;
  }

  return (
    <div className="mt-8 rounded-lg border border-qatar-100 bg-white p-5 text-right shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-qatar-700">{text({ ar: "روابط التحميل", en: "Download links" })}</p>
          <p className="mt-1 text-sm text-zinc-500">{text({ ar: "التحميل يتم بطلب آمن بدون وضع الرمز السري في رابط المتصفح.", en: "Downloads use a secure request without exposing the secret token in the browser URL." })}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><ShieldCheck size={14} /> {text({ ar: "آمن", en: "Secure" })}</span>
      </div>

      {error ? <div className="mt-4 rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-4 space-y-3">
        {files.map((file) => {
          const isDownloading = downloadingId === file.id;
          return (
            <button
              key={file.id}
              type="button"
              onClick={() => void downloadOne(file)}
              disabled={Boolean(downloadingId)}
              className="flex w-full items-center justify-between rounded-[10px] border border-qatar-100 px-4 py-3 text-right transition hover:bg-qatar-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-qatar-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800">
                {isDownloading ? <Loader2 size={16} className="animate-spin text-qatar-700" /> : <Download size={16} className="text-qatar-700" />}
                {file.title}
              </span>
              <span className="text-xs text-zinc-500">{file.productTitle}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-zinc-500">
        {text({ ar: "إجمالي الملفات", en: "Total files" })}: {files.length} · {text({ ar: "الحجم التقريبي", en: "Approximate size" })}: {Math.round(totalSize / 1024)} KB
      </div>
    </div>
  );
}
