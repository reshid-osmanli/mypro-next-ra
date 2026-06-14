"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Cloud, HardDrive, Loader2, LogIn, RefreshCw, ShieldCheck, Wallet, History, Gift, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { currencyLabel, dateLabel, formatBytes, numberLabel } from "@/lib/utils";
import { useSitePreferences } from "./site-preferences";

type WalletTransaction = {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string | null;
  orderId: string | null;
  createdAt: string;
};

type PurchaseLibrary = {
  email: string;
  wallet: {
    balance: number;
    transactions: WalletTransaction[];
  };
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

  async function syncDrive() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/purchases/drive/sync", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || text({ ar: "تعذر الحفظ في Google Drive", en: "Unable to save to Google Drive" }));
      const refreshed = await fetch("/api/purchases").then((response) => response.json());
      setLibrary(refreshed);
      const uploadedCount = numberLabel(Number(data.uploaded ?? 0));
      const failedCount = numberLabel(Number(data.failed?.length ?? 0));
      const baseMsg = text({ ar: `تم حفظ ${uploadedCount} ملف في Google Drive.`, en: `${uploadedCount} file(s) saved to Google Drive.` });
      const failedMsg = data.failed?.length ? text({ ar: ` فشل إرفاق ${failedCount} ملف.`, en: ` ${failedCount} file(s) failed to upload.` }) : "";
      setMessage(baseMsg + failedMsg);
    } catch (error) {
      if (error instanceof Error && error.message.includes("429")) {
        setMessage(text({ ar: "تم تجاوز حد التنزيلات. يرجى الانتظار 15 دقيقة ثم المحاولة مرة أخرى.", en: "Rate limit exceeded. Please wait 15 minutes and try again." }));
      } else {
        setMessage(error instanceof Error ? error.message : text({ ar: "حدث خطأ غير متوقع", en: "An unexpected error occurred" }));
      }
    } finally {
      setBusy(false);
    }
  }

  if (!library) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="panel space-y-5 p-6 text-right">
          <div className="inline-flex items-center gap-2 rounded-full bg-qatar-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-qatar-800">
            <ShieldCheck size={14} /> {text({ ar: "جلسة آمنة", en: "Secure session" })}
          </div>
          <h1 className="text-3xl font-black text-zinc-950">{text({ ar: "سجل الدخول لعرض مشترياتك", en: "Sign in to view purchases" })}</h1>
          <p className="leading-8 text-zinc-600">
            {text({
              ar: "صفحة المشتريات مرتبطة ببريد حساب Google الذي سجلت الدخول به، ولن تطلب رابط تحقق منفصل.",
              en: "Purchases are tied to the Google email you sign in with, without a separate verification link."
            })}
          </p>
          {message ? <div className="rounded-lg border border-qatar-100 bg-qatar-50 px-4 py-3 text-sm text-qatar-800">{message}</div> : null}
          <Link href="/login?callbackUrl=/purchases" className="btn-primary w-full">
            <LogIn size={16} />
            {text({ ar: "تسجيل الدخول", en: "Sign in" })}
          </Link>
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
              <ShieldCheck size={14} /> {text({ ar: "حساب مشتريات آمن", en: "Secure purchase account" })}
            </div>
            <h1 className="mt-4 text-3xl font-black text-zinc-950">{text({ ar: "مشترياتك المحفوظة", en: "Saved purchases" })}</h1>
            <div className="mt-4 inline-flex max-w-full items-center gap-3 rounded-2xl border border-qatar-100 bg-white px-4 py-3 shadow-sm">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-qatar-700 text-sm font-black text-white">@</span>
              <span className="min-w-0 text-left" dir="ltr">
                <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Google email</span>
                <span className="block truncate text-sm font-black text-zinc-950">{library.email}</span>
              </span>
            </div>
            <p className="mt-2 leading-8 text-zinc-600">{text({ ar: "هذه الصفحة تعرض فقط الطلبات التي وافقت على حفظها أثناء الدفع.", en: "This page shows only orders you agreed to save during checkout." })}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-qatar-50 px-4 py-3"><p className="text-xs text-qatar-700">{text({ ar: "الطلبات", en: "Orders" })}</p><p className="text-xl font-black text-qatar-900">{numberLabel(totals.orders)}</p></div>
            <div className="rounded-lg bg-zinc-50 px-4 py-3"><p className="text-xs text-zinc-500">{text({ ar: "الملفات", en: "Files" })}</p><p className="text-xl font-black text-zinc-950">{numberLabel(totals.files)}</p></div>
            <div className="rounded-lg bg-emerald-50 px-4 py-3"><p className="text-xs text-emerald-700">{text({ ar: "الإجمالي", en: "Total" })}</p><p className="text-xl font-black text-emerald-800">{currencyLabel(totals.total)}</p></div>
          </div>
        </div>
      </div>

      <div className="panel p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Wallet size={20} className="text-qatar-700" />
              <h2 className="text-xl font-black text-zinc-950">{text({ ar: "المحفظة", en: "Wallet" })}</h2>
            </div>
            <p className="mt-1 text-sm leading-7 text-zinc-600">
              {text({
                ar: "رصيدك الحالي يمكن استخدامه لخصم على مشترياتك القادمة.",
                en: "Your current balance can be used for discounts on future purchases."
              })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500">{text({ ar: "الرصيد الحالي", en: "Current balance" })}</p>
            <p className="text-3xl font-black text-qatar-800">{currencyLabel(library.wallet.balance)}</p>
          </div>
        </div>

        {library.wallet.transactions.length > 0 ? (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <History size={16} className="text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-700">{text({ ar: "سجل المعاملات", en: "Transaction history" })}</h3>
            </div>
            <div className="space-y-2">
              {library.wallet.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-lg border border-qatar-100 bg-white px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    {tx.type === "credit" ? (
                      <CheckCircle size={14} className="text-emerald-600" />
                    ) : (
                      <Gift size={14} className="text-sky-600" />
                    )}
                    <span className="text-zinc-900">{tx.description || (tx.type === "credit" ? text({ ar: "إيداع", en: "Credit" }) : text({ ar: "خصم", en: "Debit" }))}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold ${tx.type === "credit" ? "text-emerald-700" : "text-sky-700"}`}>
                      {tx.type === "credit" ? "+" : "-"}{currencyLabel(tx.amount)}
                    </span>
                    <span className="text-xs text-zinc-500">{dateLabel(tx.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="panel overflow-hidden p-0">
        <div className="border-b border-qatar-100 bg-gradient-to-l from-qatar-50 to-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm">
              <HardDrive size={20} className="text-qatar-700" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-950">{text({ ar: "Google Drive", en: "Google Drive" })}</h2>
              <p className="mt-1 text-xs font-bold text-zinc-500">{text({ ar: "حفظ اختياري ومنظّم للملفات المشتراة", en: "Optional organized backup for purchased files" })}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
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
            <button type="button" onClick={() => window.location.assign("/api/purchases/drive/start")} className="btn-secondary border-qatar-200 bg-white">
              <HardDrive size={16} />
              {text({ ar: "ربط Google Drive بأمان", en: "Securely connect Google Drive" })}
            </button>
          )}
        </div>
        {message ? <div className="mx-6 mb-6 rounded-lg border border-qatar-100 bg-qatar-50 px-4 py-3 text-sm text-qatar-800">{message}</div> : null}
      </div>

      <div className="space-y-4">
        {library.orders.length === 0 ? (
          <div className="panel p-6 text-sm leading-7 text-zinc-600">
            {text({
              ar: "لا توجد مشتريات محفوظة لهذا البريد بعد. لاختبار الميزة، سجّل الدخول قبل الدفع واترك خيار حفظ المشتريات مفعّلًا في صفحة الدفع.",
              en: "No saved purchases were found for this email yet. To test this feature, sign in before checkout and keep purchase tracking enabled."
            })}
          </div>
        ) : null}

        {library.orders.map((order) => (
          <div key={order.id} className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-qatar-700">{dateLabel(order.createdAt)}</p>
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
