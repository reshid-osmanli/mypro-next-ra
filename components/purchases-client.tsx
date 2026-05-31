"use client";

import { useMemo, useState } from "react";
import { Cloud, HardDrive, Loader2, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { currencyLabel, formatBytes } from "@/lib/utils";
import { useSitePreferences } from "./site-preferences";

type PurchaseLibrary = {
  email: string;
  drive: {
    connected: boolean;
    connectedAt: string | null;
    lastSyncedAt: string | null;
  };
  orders: Array<{
    id: string;
    createdAt: string;
    total: number;
    paymentMethod: string;
    items: Array<{
      id: string;
      productTitle: string;
      price: number;
      quantity: number;
      files: Array<{ id: string; title: string; mimeType: string; size: number }>;
    }>;
  }>;
};

type Props = {
  initialLibrary: PurchaseLibrary | null;
};

function statusFromSearch(value: string | null) {
  if (value === "connected") return { ar: "تم ربط Google Drive بنجاح.", en: "Google Drive connected successfully." };
  if (value === "not-configured") return { ar: "ربط Google Drive يحتاج إضافة GOOGLE_CLIENT_SECRET في ملف البيئة.", en: "Google Drive needs GOOGLE_CLIENT_SECRET in the environment." };
  if (value === "failed") return { ar: "تعذر إكمال ربط Google Drive.", en: "Unable to complete Google Drive connection." };
  return null;
}

export function PurchasesClient({ initialLibrary }: Props) {
  const { text } = useSitePreferences();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(initialLibrary?.email ?? "");
  const [library, setLibrary] = useState(initialLibrary);
  const [message, setMessage] = useState(() => {
    const driveMessage = statusFromSearch(searchParams.get("drive"));
    return driveMessage ? text(driveMessage) : "";
  });
  const [busy, setBusy] = useState(false);

  const totals = useMemo(() => {
    const orders = library?.orders ?? [];
    const files = orders.flatMap((order) => order.items.flatMap((item) => item.files));
    return {
      orders: orders.length,
      files: files.length,
      total: orders.reduce((sum, order) => sum + order.total, 0)
    };
  }, [library]);

  async function requestLink() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/purchases/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || text({ ar: "تعذر إرسال رابط التحقق", en: "Unable to send the verification link" }));
      setMessage(text({ ar: "إذا كان لهذا البريد مشتريات محفوظة فسيصل رابط التحقق الآن.", en: "If this email has saved purchases, a verification link has been sent." }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text({ ar: "حدث خطأ غير متوقع", en: "An unexpected error occurred" }));
    } finally {
      setBusy(false);
    }
  }

  async function syncDrive() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/purchases/drive/sync", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || text({ ar: "تعذر الحفظ في Google Drive", en: "Unable to save to Google Drive" }));
      const refreshed = await fetch("/api/purchases").then((response) => response.json());
      setLibrary(refreshed);
      setMessage(text({ ar: `تم حفظ ${data.uploaded ?? 0} ملف في Google Drive.`, en: `${data.uploaded ?? 0} file(s) saved to Google Drive.` }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text({ ar: "حدث خطأ غير متوقع", en: "An unexpected error occurred" }));
    } finally {
      setBusy(false);
    }
  }

  if (!library) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="panel space-y-5 p-6 text-right">
          <div className="inline-flex items-center gap-2 rounded-full bg-qatar-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-qatar-800">
            <ShieldCheck size={14} /> {text({ ar: "تحقق بالبريد", en: "Email verification" })}
          </div>
          <h1 className="text-3xl font-black text-zinc-950">{text({ ar: "تتبع مشترياتي", en: "My purchases" })}</h1>
          <p className="leading-8 text-zinc-600">
            {text({
              ar: "أدخل البريد الذي وافقت على حفظ مشترياتك عليه وقت الدفع. لن تظهر أي مشتريات بدون رابط تحقق يصل إلى نفس البريد.",
              en: "Enter the email you consented to save purchases under during checkout. Purchases are shown only through a verification link sent to that email."
            })}
          </p>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-zinc-700">{text({ ar: "البريد الإلكتروني", en: "Email address" })}</span>
            <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
          </label>
          {message ? <div className="rounded-lg border border-qatar-100 bg-qatar-50 px-4 py-3 text-sm text-qatar-800">{message}</div> : null}
          <button type="button" onClick={requestLink} disabled={busy || !email.trim()} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            {text({ ar: "إرسال رابط التحقق", en: "Send verification link" })}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 text-right lg:px-8">
      <div className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-qatar-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-qatar-800">
              <ShieldCheck size={14} /> {library.email}
            </div>
            <h1 className="mt-4 text-3xl font-black text-zinc-950">{text({ ar: "مشترياتك المحفوظة", en: "Saved purchases" })}</h1>
            <p className="mt-2 leading-8 text-zinc-600">{text({ ar: "هذه الصفحة تعرض فقط الطلبات التي وافقت على حفظها أثناء الدفع.", en: "This page shows only orders you agreed to save during checkout." })}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-qatar-50 px-4 py-3"><p className="text-xs text-qatar-700">{text({ ar: "الطلبات", en: "Orders" })}</p><p className="text-xl font-black text-qatar-900">{totals.orders}</p></div>
            <div className="rounded-lg bg-zinc-50 px-4 py-3"><p className="text-xs text-zinc-500">{text({ ar: "الملفات", en: "Files" })}</p><p className="text-xl font-black text-zinc-950">{totals.files}</p></div>
            <div className="rounded-lg bg-emerald-50 px-4 py-3"><p className="text-xs text-emerald-700">{text({ ar: "الإجمالي", en: "Total" })}</p><p className="text-xl font-black text-emerald-800">{currencyLabel(totals.total)}</p></div>
          </div>
        </div>
      </div>

      <div className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-zinc-950">{text({ ar: "Google Drive", en: "Google Drive" })}</h2>
            <p className="mt-1 text-sm leading-7 text-zinc-600">
              {library.drive.connected
                ? text({ ar: "الحساب مربوط. يمكنك حفظ الملفات التي لم تحفظ من قبل.", en: "Connected. You can save files that were not synced before." })
                : text({ ar: "الربط اختياري ولن يحدث إلا بموافقتك من حساب Google.", en: "Connection is optional and happens only with your Google consent." })}
            </p>
          </div>
          {library.drive.connected ? (
            <button type="button" onClick={syncDrive} disabled={busy} className="btn-primary disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {text({ ar: "حفظ في Drive", en: "Save to Drive" })}
            </button>
          ) : (
            <button type="button" onClick={() => window.location.assign("/api/purchases/drive/start")} className="btn-secondary">
              <HardDrive size={16} />
              {text({ ar: "ربط Google Drive", en: "Connect Google Drive" })}
            </button>
          )}
        </div>
        {message ? <div className="mt-4 rounded-lg border border-qatar-100 bg-qatar-50 px-4 py-3 text-sm text-qatar-800">{message}</div> : null}
      </div>

      <div className="space-y-4">
        {library.orders.map((order) => (
          <div key={order.id} className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-qatar-700">{new Date(order.createdAt).toLocaleDateString("ar-QA")}</p>
                <h3 className="mt-1 text-lg font-black text-zinc-950">{text({ ar: "طلب", en: "Order" })} #{order.id.slice(-8)}</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{currencyLabel(order.total)}</span>
            </div>
            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-lg border border-qatar-100 bg-white px-4 py-3">
                  <p className="font-bold text-zinc-950">{item.productTitle}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                    {item.files.map((file) => (
                      <span key={file.id} className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-3 py-1">
                        <Cloud size={12} /> {file.title} · {formatBytes(file.size)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
