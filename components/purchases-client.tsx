"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Cloud, Gift, HardDrive, History, Inbox, LogIn, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { currencyLabel, dateLabel, formatBytes, numberLabel } from "@/lib/utils";
import { useSitePreferences } from "@/components/site-preferences";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

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
      const res = await fetch("/api/purchases/drive/sync", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" });
      let data: any = {};
      try { data = await res.json(); } catch { /* ignore parse error */ }
      if (!res.ok) throw new Error(data?.error || text({ ar: "تعذر الحفظ في Google Drive", en: "Unable to save to Google Drive" }));
      const refreshedRes = await fetch("/api/purchases", { credentials: "include" });
      let refreshed: PurchaseLibrary | null = null;
      try { refreshed = await refreshedRes.json(); } catch { /* ignore */ }
      if (refreshed && refreshed.wallet && Array.isArray(refreshed.orders)) {
        setLibrary(refreshed);
      }
      const uploadedCount = numberLabel(Number(data.uploaded ?? 0));
      const failedCount = numberLabel(Number(data.failed?.length ?? 0));
      const baseMsg = text({ ar: `تم حفظ ${uploadedCount} ملف في Google Drive.`, en: `${uploadedCount} file(s) saved to Google Drive.` });
      const failedMsg = data.failed?.length ? text({ ar: ` فشل إرفاق ${failedCount} ملف.`, en: ` ${failedCount} file(s) failed to upload.` }) : "";
      setMessage(baseMsg + failedMsg);
    } catch (error: any) {
      if (error?.name === "TypeError" && error?.message?.includes("fetch")) {
        setMessage(text({ ar: "فشل الاتصال بالخادم. تحقق من الإنترنت وأعد المحاولة.", en: "Failed to connect to server. Check your connection and try again." }));
      } else if (error instanceof Error && error.message.includes("429")) {
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
        <div className="card space-y-5 p-7">
          <span className="inline-flex h-8 items-center gap-2 rounded-pill border border-line bg-surface px-3 text-caption font-semibold text-ink-soft">
            <ShieldCheck size={13} aria-hidden="true" />
            {text({ ar: "جلسة آمنة", en: "Secure session" })}
          </span>
          <h1 className="text-h1 font-bold text-ink">
            {text({ ar: "سجل الدخول لعرض مشترياتك", en: "Sign in to view purchases" })}
          </h1>
          <p className="text-body leading-8 text-ink-soft">
            {text({
              ar: "صفحة المشتريات مرتبطة ببريد حساب Google الذي سجلت الدخول به، ولن تطلب رابط تحقق منفصل.",
              en: "Purchases are tied to the Google email you sign in with, without a separate verification link."
            })}
          </p>
          {message ? <div className="rounded-sm border border-brand/20 bg-brand-soft/50 px-4 py-3 text-body-sm font-semibold text-brand-deep">{message}</div> : null}
          <Button href="/login?callbackUrl=/purchases" variant="primary" size="lg" className="w-full">
            <LogIn size={16} aria-hidden="true" />
            {text({ ar: "تسجيل الدخول", en: "Sign in" })}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* account overview */}
      <div className="card p-6 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <span className="inline-flex h-8 items-center gap-2 rounded-pill border border-line bg-surface px-3 text-caption font-semibold text-ink-soft">
              <ShieldCheck size={13} aria-hidden="true" />
              {text({ ar: "حساب مشتريات آمن", en: "Secure purchase account" })}
            </span>
            <h1 className="mt-4 text-h1 font-bold text-ink">
              {text({ ar: "مشترياتك المحفوظة", en: "Saved purchases" })}
            </h1>
            <div className="mt-4 inline-flex max-w-full items-center gap-3 rounded-sm border border-line bg-surface px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-brand text-sm font-bold text-white" aria-hidden="true">@</span>
              <span className="min-w-0" dir="ltr">
                <span className="block text-caption font-semibold text-ink-faint">Google email</span>
                <span className="block truncate text-body-sm font-bold text-ink">{library.email}</span>
              </span>
            </div>
            <p className="mt-3 text-body-sm leading-8 text-ink-soft">
              {text({ ar: "هذه الصفحة تعرض فقط الطلبات التي وافقت على حفظها أثناء الدفع.", en: "This page shows only orders you agreed to save during checkout." })}
            </p>
          </div>
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3">
            <div className="rounded-sm border border-line bg-surface px-4 py-3">
              <p className="text-caption text-ink-faint">{text({ ar: "الطلبات", en: "Orders" })}</p>
              <p className="tnum mt-1 text-h3 font-bold text-ink">{numberLabel(totals.orders)}</p>
            </div>
            <div className="rounded-sm border border-line bg-surface px-4 py-3">
              <p className="text-caption text-ink-faint">{text({ ar: "الملفات", en: "Files" })}</p>
              <p className="tnum mt-1 text-h3 font-bold text-ink">{numberLabel(totals.files)}</p>
            </div>
            <div className="rounded-sm border border-line bg-surface px-4 py-3">
              <p className="text-caption text-ink-faint">{text({ ar: "الإجمالي", en: "Total" })}</p>
              <p className="tnum mt-1 text-h3 font-bold text-brand-deep" dir="ltr">{currencyLabel(totals.total)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* wallet */}
      <div className="card p-6 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Wallet size={18} className="text-brand" aria-hidden="true" />
              <h2 className="text-h3 font-bold text-ink">{text({ ar: "المحفظة", en: "Wallet" })}</h2>
            </div>
            <p className="mt-1.5 text-body-sm leading-8 text-ink-soft">
              {text({
                ar: "رصيدك الحالي يمكن استخدامه لخصم على مشترياتك القادمة.",
                en: "Your current balance can be used for discounts on future purchases."
              })}
            </p>
          </div>
          <div className="text-end">
            <p className="text-caption text-ink-faint">{text({ ar: "الرصيد الحالي", en: "Current balance" })}</p>
            <p className="tnum mt-1 text-price-lg font-bold text-brand-deep" dir="ltr">{currencyLabel(library.wallet.balance)}</p>
          </div>
        </div>

        {library.wallet.transactions.length > 0 ? (
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-2">
              <History size={15} className="text-ink-faint" aria-hidden="true" />
              <h3 className="text-body-sm font-semibold text-ink">{text({ ar: "سجل المعاملات", en: "Transaction history" })}</h3>
            </div>
            <div className="space-y-2">
              {library.wallet.transactions.map((tx) => (
                <div key={tx.id} className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line bg-surface px-4 py-3 text-body-sm">
                  <div className="flex items-center gap-2.5">
                    {tx.type === "credit" ? (
                      <CheckCircle size={15} className="text-accent-teal" aria-hidden="true" />
                    ) : (
                      <Gift size={15} className="text-ink-faint" aria-hidden="true" />
                    )}
                    <span className="text-ink">{tx.description || (tx.type === "credit" ? text({ ar: "إيداع", en: "Credit" }) : text({ ar: "خصم", en: "Debit" }))}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`tnum font-bold ${tx.type === "credit" ? "text-accent-teal" : "text-ink-soft"}`} dir="ltr">
                      {tx.type === "credit" ? "+" : "-"}{currencyLabel(tx.amount)}
                    </span>
                    <span className="text-caption text-ink-faint">{dateLabel(tx.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* drive */}
      <div className="card p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-sm border border-line bg-surface text-brand">
              <HardDrive size={20} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-h3 font-bold text-ink">Google Drive</h2>
              <p className="mt-0.5 text-caption text-ink-faint">
                {text({ ar: "حفظ اختياري ومنظّم للملفات المشتراة", en: "Optional organized backup for purchased files" })}
              </p>
            </div>
          </div>
          {library.drive.connected ? (
            <Button onClick={syncDrive} variant="primary" size="md" disabled={busy} loading={busy}>
              {!busy && <RefreshCw size={15} aria-hidden="true" />}
              {text({ ar: "حفظ في Drive", en: "Save to Drive" })}
            </Button>
          ) : (
            <Button onClick={() => window.location.assign("/api/purchases/drive/start")} variant="secondary" size="md">
              <HardDrive size={15} aria-hidden="true" />
              {text({ ar: "ربط Google Drive بأمان", en: "Securely connect Google Drive" })}
            </Button>
          )}
        </div>
        <p className="mt-4 text-body-sm leading-8 text-ink-soft">
          {library.drive.connected
            ? text({ ar: "الحساب مربوط. يمكنك حفظ الملفات التي لم تحفظ من قبل.", en: "Connected. You can save files that were not synced before." })
            : text({ ar: "الربط اختياري ولن يحدث إلا بموافقتك من حساب Google.", en: "Connection is optional and happens only with your Google consent." })}
        </p>
        {message ? <div className="mt-4 rounded-sm border border-brand/20 bg-brand-soft/50 px-4 py-3 text-body-sm font-semibold text-brand-deep">{message}</div> : null}
      </div>

      {/* orders */}
      <div className="space-y-4">
        {library.orders.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={text({ ar: "لا توجد طلبات بعد", en: "No orders yet" })}
            description={text({ ar: "ستظهر طلباتك هنا بعد إتمام أول عملية شراء.", en: "Your orders will appear here after your first purchase." })}
            action={
              <Button href="/products" variant="primary" size="md">
                {text({ ar: "ابدأ التسوق", en: "Start shopping" })}
              </Button>
            }
          />
        ) : null}

        {library.orders.map((order) => (
          <div key={order.id} className="card p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-caption font-semibold text-ink-faint">{dateLabel(order.createdAt)}</p>
                <h3 className="mt-1 text-h3 font-bold text-ink">
                  {text({ ar: "طلب", en: "Order" })} <span className="tnum" dir="ltr">#{order.id.slice(-8)}</span>
                </h3>
              </div>
              <span className="tnum rounded-pill bg-accent-teal-soft px-3 py-1 text-body-sm font-bold text-accent-teal" dir="ltr">
                {currencyLabel(order.total)}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-sm border border-line bg-surface px-4 py-3.5">
                  <p className="text-body-sm font-bold text-ink">{item.productTitle}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {item.files.map((file) => (
                      <span key={file.id} className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-paper-deep/50 px-3 py-1 text-caption text-ink-soft">
                        <Cloud size={12} aria-hidden="true" /> {file.title} · <span className="tnum" dir="ltr">{formatBytes(file.size)}</span>
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
