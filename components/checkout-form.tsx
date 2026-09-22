"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, CreditCard, Loader2, Mail, Phone, ShieldCheck, Ticket, User2, WalletCards } from "lucide-react";
import { useSession } from "next-auth/react";
import Script from "next/script";
import { useCart } from "@/components/cart-provider";
import { PayPalCheckoutButton } from "@/components/paypal-checkout-button";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { paypalSdkScriptUrl } from "@/lib/paypal-client";
import { subtotal } from "@/lib/site-math";
import { calculateBundleDiscount, bundleDiscountLabel } from "@/lib/bundle-discounts";
import { currencyLabel } from "@/lib/utils";
import { useSitePreferences } from "@/components/site-preferences";
import { HoneypotFields } from "@/components/honeypot-fields";
import { getCsrfToken } from "@/components/csrf-provider";
import { cn } from "@/lib/utils";

const providers = [
  {
    id: "paypal" as const,
    name: { ar: "PayPal", en: "PayPal" },
    hint: { ar: "أزرار PayPal الرسمية", en: "Official PayPal buttons" },
    enabled: Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID)
  },
  {
    id: "stripe" as const,
    name: { ar: "Stripe", en: "Stripe" },
    hint: { ar: "تحويل آمن إلى Stripe Checkout", en: "Secure redirect to Stripe Checkout" },
    enabled: true
  }
];

type AvailableVoucher = { code: string; amount: number };

const CSRF_HEADER = "x-csrf-token";

const inputClass =
  "h-11 w-full rounded-sm border border-line bg-surface ps-11 pe-4 text-body text-ink outline-none transition-colors duration-instant placeholder:text-ink-faint focus:border-brand focus:ring-2 focus:ring-brand/25";
const textareaClass =
  "w-full rounded-sm border border-line bg-surface p-3.5 text-body leading-8 text-ink outline-none transition-colors duration-instant placeholder:text-ink-faint focus:border-brand focus:ring-2 focus:ring-brand/25";

export function CheckoutForm() {
  const formRef = useRef<HTMLFormElement>(null);
  // Track when the form was first rendered — used for honeypot timing check
  const renderedAtRef = useRef<number>(Date.now());
  const { data: session } = useSession();
  const { items, clearCart } = useCart();
  const { text } = useSitePreferences();
  const total = useMemo(() => subtotal(items), [items]);
  const bundleDiscount = useMemo(() => calculateBundleDiscount(items), [items]);
  const paypalEnabled = providers.find((provider) => provider.id === "paypal")?.enabled ?? false;
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
  const [loading, setLoading] = useState(false);
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<(typeof providers)[number]["id"]>(paypalEnabled ? "paypal" : "stripe");
  const [message, setMessage] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState<number | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<AvailableVoucher[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletAmountToUse, setWalletAmountToUse] = useState<number | "">("");
  const [showVoucherSelector, setShowVoucherSelector] = useState(false);
  const [purchaseTrackingConsent, setPurchaseTrackingConsent] = useState(false);
  const signedInEmail = session?.user?.email?.trim() ?? "";

  useEffect(() => {
    if (session?.user?.name && !customerName) setCustomerName(session.user.name);
    if (signedInEmail) setCustomerEmail(signedInEmail);
  }, [customerName, session?.user?.name, signedInEmail]);

  useEffect(() => {
    if (signedInEmail) {
      setPurchaseTrackingConsent(true);
      loadAvailableVouchers();
      loadWalletBalance();
    }
  }, [signedInEmail]);

  useEffect(() => {
    if (!items.length || !customerEmail.includes("@")) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/abandoned-carts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customerEmail,
          customerName,
          items
        })
      }).catch(() => null);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [items, customerEmail, customerName]);

  async function loadWalletBalance() {
    try {
      const res = await fetch("/api/wallet", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Number.isFinite(Number(data.balance))) setWalletBalance(Math.max(0, Number(data.balance)));
    } catch {
      setWalletBalance(0);
    }
  }

  async function loadAvailableVouchers() {
    try {
      const res = await fetch("/api/vouchers/available");
      const data = await res.json();
      if (res.ok && Array.isArray(data.vouchers)) {
        setAvailableVouchers(data.vouchers);
      }
    } catch {
      setAvailableVouchers([]);
    }
  }

  const walletDiscount = useMemo(() => Math.min(Number(walletAmountToUse) || 0, walletBalance, Math.max(0, total - bundleDiscount.discount - (voucherDiscount ?? 0))), [total, bundleDiscount.discount, voucherDiscount, walletBalance, walletAmountToUse]);

  const finalTotal = useMemo(() => {
    return Math.max(0, total - bundleDiscount.discount - (voucherDiscount ?? 0) - walletDiscount);
  }, [total, bundleDiscount.discount, voucherDiscount, walletDiscount]);

  async function validateVoucher(code?: string) {
    const codeToValidate = code ?? voucherCode.trim();
    if (!codeToValidate || !signedInEmail) return;
    setValidatingVoucher(true);
    setVoucherError(null);
    try {
      const response = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToValidate })
      });
      const data = await response.json();
      if (!response.ok || !data.valid) {
        setVoucherError(data.error || text({ ar: "القسيمة غير صالحة", en: "Invalid voucher" }));
        setVoucherDiscount(null);
        setVoucherCode("");
      } else {
        setVoucherDiscount(data.voucher.amount);
        setVoucherCode(codeToValidate);
        setShowVoucherSelector(false);
      }
    } catch {
      setVoucherError(text({ ar: "فشل التحقق من القسيمة", en: "Failed to validate voucher" }));
      setVoucherDiscount(null);
    } finally {
      setValidatingVoucher(false);
    }
  }

  async function submitStripe(formData: FormData) {
    if (!items.length) return;
    setLoading(true);
    setMessage("");

    // Extract honeypot fields from form — bots fill these, humans don't
    const honeypotWebsite = String(formData.get("website") ?? "");
    const honeypotEmailConfirm = String(formData.get("email_confirm") ?? "");
    const honeypotPhoneUrl = String(formData.get("phone_url") ?? "");
    const renderedAt = renderedAtRef.current;

    // Get CSRF token from cookie
    const csrfToken = getCsrfToken();

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfToken) headers[CSRF_HEADER] = csrfToken;

      const response = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          items,
          customerName: String(formData.get("customerName") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          notes: String(formData.get("notes") ?? ""),
          purchaseTrackingConsent: formData.get("purchaseTrackingConsent") === "on",
          paymentMethod: "stripe",
          voucherCode: voucherDiscount ? voucherCode.trim() : undefined,
          walletAmountToUse: Number(walletAmountToUse) || 0,
          // Honeypot fields
          website: honeypotWebsite,
          email_confirm: honeypotEmailConfirm,
          phone_url: honeypotPhoneUrl,
          renderedAt
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || text({ ar: "تعذر إنشاء جلسة Stripe", en: "Unable to create the Stripe session" }));
      if (!data?.url) throw new Error(text({ ar: "لم يتم استلام رابط الدفع الآمن", en: "No secure payment URL was returned" }));

      window.location.assign(String(data.url));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text({ ar: "حدث خطأ غير متوقع", en: "An unexpected error occurred" }));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (paymentMethod === "paypal") return;
    const form = new FormData(e.currentTarget);
    await submitStripe(form);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="card space-y-7 p-6 md:p-8">
      {paypalEnabled && paypalClientId ? (
        <Script
          id="paypal-js-sdk"
          strategy="afterInteractive"
          src={paypalSdkScriptUrl(paypalClientId, process.env.NEXT_PUBLIC_PAYPAL_CURRENCY ?? "USD")}
          onError={() => {
            setMessage(
              text({
                ar: "تعذر تحميل سكربت PayPal. تحقق من إعدادات البيئة على Vercel وأعد النشر.",
                en: "Unable to load the PayPal script. Check your Vercel environment settings and redeploy."
              })
            );
          }}
        />
      ) : null}

      {/* Honeypot anti-bot fields — invisible to humans, filled by bots */}
      <HoneypotFields renderedAt={renderedAtRef.current} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="block text-body-sm font-semibold text-ink">{text({ ar: "الاسم الكامل", en: "Full name" })}</span>
          <div className="relative">
            <User2 size={16} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <input name="customerName" className={inputClass} placeholder={text({ ar: "اسم العميل", en: "Customer name" })} value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="block text-body-sm font-semibold text-ink">{text({ ar: "البريد الإلكتروني", en: "Email address" })}</span>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <input name="email" type="email" className={inputClass} placeholder="name@example.com" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} readOnly={Boolean(signedInEmail)} required />
          </div>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="block text-body-sm font-semibold text-ink">{text({ ar: "رقم الهاتف", en: "Phone number" })}</span>
        <div className="relative">
          <Phone size={16} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input name="phone" className={inputClass} placeholder="+974 ..." />
        </div>
      </label>

      <label className="block space-y-1.5">
        <span className="block text-body-sm font-semibold text-ink">{text({ ar: "ملاحظات", en: "Notes" })}</span>
        <textarea name="notes" className={textareaClass} rows={3} placeholder={text({ ar: "أي ملاحظات إضافية حول الطلب...", en: "Any additional notes about the order..." })} />
      </label>

      {signedInEmail ? (
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="purchaseTrackingConsent"
            checked={purchaseTrackingConsent}
            onChange={(e) => setPurchaseTrackingConsent(e.target.checked)}
            className="mt-1 size-5 shrink-0 cursor-pointer rounded border-line accent-[#8A1538]"
          />
          <span className="text-body-sm leading-8 text-ink-soft">
            {text({
              ar: "أوافق على حفظ مشترياتي ضمن بريدي الإلكتروني لراجعها لاحقًا وإرفاقها اختيارياً بحساب Google Drive.",
              en: "I agree to save my purchases under my email so I can view them later and optionally connect Google Drive."
            })}
          </span>
        </label>
      ) : null}

      {/* voucher */}
      <div className="space-y-3">
        <p className="text-body-sm font-semibold text-ink">{text({ ar: "قسيمة الخصم", en: "Voucher code" })}</p>

        {!voucherDiscount && signedInEmail ? (
          <div className="flex flex-wrap gap-2">
            <input
              className={cn(inputClass, "min-w-[220px] flex-1 ps-4")}
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder={text({ ar: "أدخل كود القسيمة", en: "Enter voucher code" })}
            />
            <Button type="button" variant="secondary" size="md" disabled={validatingVoucher || !voucherCode.trim()} onClick={() => validateVoucher()} loading={validatingVoucher}>
              {!validatingVoucher && <Ticket size={15} aria-hidden="true" />}
              {text({ ar: "تطبيق", en: "Apply" })}
            </Button>
          </div>
        ) : null}

        {voucherError ? <p className="text-body-sm font-semibold text-accent-danger">{voucherError}</p> : null}

        {availableVouchers.length > 0 && !voucherDiscount && signedInEmail ? (
          <div className="max-h-40 overflow-y-auto rounded-sm border border-line bg-surface p-2">
            {availableVouchers.map((voucher) => (
              <button
                key={voucher.code}
                type="button"
                onClick={() => validateVoucher(voucher.code)}
                disabled={validatingVoucher}
                className="flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-body-sm transition-colors duration-instant hover:bg-paper-deep disabled:opacity-60"
              >
                <span className="text-ink-soft">
                  {text({ ar: "قسيمة خصم بقيمة", en: "Voucher for" })} <span className="tnum" dir="ltr">{currencyLabel(voucher.amount)}</span>
                </span>
                <span className="font-semibold text-brand-deep">{text({ ar: "تطبيق", en: "Apply" })}</span>
              </button>
            ))}
          </div>
        ) : !voucherDiscount && signedInEmail ? (
          <p className="text-body-sm text-ink-faint">{text({ ar: "لا يوجد قسائم متاحة لك حالياً", en: "No available vouchers right now" })}</p>
        ) : voucherDiscount ? (
          <p className="flex items-center gap-1.5 text-body-sm font-semibold text-teal-700">
            <CheckCircle size={15} aria-hidden="true" />
            {text({ ar: "تم تطبيق خصم ", en: "Applied discount " })}
            <span className="tnum" dir="ltr">{currencyLabel(voucherDiscount)}</span>
          </p>
        ) : signedInEmail ? null : (
          <p className="text-body-sm text-ink-faint">{text({ ar: "سجّل الدخول لاستخدام القسائم", en: "Sign in to use vouchers" })}</p>
        )}
      </div>

      {/* wallet */}
      {signedInEmail && walletBalance > 0 ? (
        <div className="rounded-sm border border-accent-teal/20 bg-accent-teal-soft p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-body-sm font-bold text-ink">
              <WalletCards size={16} className="text-accent-teal" aria-hidden="true" />
              {text({ ar: "رصيد المحفظة المتاح", en: "Available wallet balance" })}
            </span>
            <span className="tnum text-body-sm font-bold text-ink" dir="ltr">{currencyLabel(walletBalance)}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-body-sm font-semibold text-ink-soft">{text({ ar: "الخصم من المحفظة:", en: "Use from wallet:" })}</span>
            <input
              type="number"
              name="walletAmountToUse"
              className="h-10 w-[120px] rounded-sm border border-line bg-surface px-3 text-body-sm text-ink outline-none transition-colors duration-instant focus:border-brand focus:ring-2 focus:ring-brand/25"
              placeholder="0"
              value={walletAmountToUse}
              onChange={(e) => setWalletAmountToUse(e.target.value === "" ? "" : Number(e.target.value))}
              max={Math.min(walletBalance, Math.max(0, total - bundleDiscount.discount - (voucherDiscount ?? 0)))}
              min="0"
            />
            <button
              type="button"
              onClick={() => setWalletAmountToUse(Math.min(walletBalance, Math.max(0, total - bundleDiscount.discount - (voucherDiscount ?? 0))))}
              className="text-caption font-semibold text-accent-teal transition-colors duration-instant hover:underline"
            >
              {text({ ar: "تطبيق الأقصى", en: "Apply max" })}
            </button>
          </div>
          {walletDiscount > 0 ? (
            <p className="mt-2 text-body-sm leading-7 text-ink-soft">
              {text({ ar: "سيُحجز هذا الرصيد مؤقتًا أثناء الدفع ويُخصم فقط بعد نجاح العملية:", en: "This balance is reserved during checkout and captured only after payment succeeds:" })}{" "}
              <span className="tnum font-semibold" dir="ltr">{currencyLabel(walletDiscount)}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {/* payment method */}
      <div className="space-y-3">
        <p className="text-body-sm font-semibold text-ink">{text({ ar: "طريقة الدفع", en: "Payment method" })}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => {
                if (provider.enabled) setPaymentMethod(provider.id);
              }}
              disabled={!provider.enabled}
              className={cn(
                "rounded-sm border p-4 text-start transition-colors duration-instant disabled:cursor-not-allowed disabled:opacity-60",
                paymentMethod === provider.id
                  ? "border-brand/50 bg-brand-soft/50"
                  : "border-line bg-surface hover:border-line-strong"
              )}
              aria-pressed={paymentMethod === provider.id}
            >
              <div className="flex items-center justify-between gap-4">
                <span>
                  <span className="block text-body font-bold text-ink">{text(provider.name)}</span>
                  <span className="mt-1 block text-caption text-ink-faint">{text(provider.hint)}</span>
                </span>
                <span
                  className={cn(
                    "rounded-pill px-3 py-1 text-caption font-semibold",
                    provider.enabled ? "bg-accent-teal-soft text-accent-teal" : "bg-paper-deep text-ink-faint"
                  )}
                >
                  {provider.enabled ? text({ ar: "مفعّل", en: "Enabled" }) : text({ ar: "غير متصل", en: "Not connected" })}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* total */}
      <div className="rounded-sm border border-line bg-paper-deep/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-body-sm text-ink-soft">
              {voucherDiscount || walletDiscount || bundleDiscount.discount ? text({ ar: "الإجمالي بعد الخصم", en: "Total after discount" }) : text({ ar: "الإجمالي التقريبي", en: "Estimated total" })}
            </span>
            {voucherDiscount || walletDiscount || bundleDiscount.discount ? (
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-caption">
                <span className="text-ink-faint line-through" dir="ltr">{currencyLabel(total)}</span>
                {bundleDiscount.discount ? <span className="text-accent-gold">{bundleDiscountLabel()}: <span className="tnum" dir="ltr">-{currencyLabel(bundleDiscount.discount)}</span></span> : null}
                {voucherDiscount ? <span className="text-accent-teal">{text({ ar: "قسيمة", en: "Voucher" })}: <span className="tnum" dir="ltr">-{currencyLabel(voucherDiscount)}</span></span> : null}
                {walletDiscount ? <span className="text-accent-teal">{text({ ar: "محفظة", en: "Wallet" })}: <span className="tnum" dir="ltr">-{currencyLabel(walletDiscount)}</span></span> : null}
              </div>
            ) : null}
          </div>
          <Price value={finalTotal} size="xl" />
        </div>
        <p className="mt-3 text-body-sm leading-8 text-ink-soft">
          {text({
            ar: "يتم إنشاء الطلب محليًا ثم إتمام الدفع عبر PayPal أو Stripe. لن يتم فتح روابط التحميل إلا بعد تحقق الخادم من الدفع.",
            en: "The order is created locally, then completed through PayPal or Stripe. Download links open only after server-side payment verification."
          })}
        </p>
      </div>

      {message ? <div className="rounded-sm border border-accent-danger/30 bg-accent-danger-soft px-4 py-3 text-body-sm font-semibold text-accent-danger">{message}</div> : null}

      {paymentMethod === "paypal" ? (
        <div className="space-y-3">
          {paypalEnabled ? (
            <PayPalCheckoutButton
              items={items}
              formRef={formRef}
              disabled={!items.length}
              voucherCode={voucherDiscount ? voucherCode.trim() : undefined}
              onStatus={setMessage}
              onCompleted={({ orderId, claimToken }) => {
                clearCart();
                if (claimToken) {
                  window.location.assign(`/api/order/redeem?claim=${encodeURIComponent(claimToken)}`);
                  return;
                }
                window.location.assign(`/thank-you?order=${encodeURIComponent(orderId)}`);
              }}
            />
          ) : (
            <div className="rounded-sm border border-dashed border-line-strong bg-surface p-5 text-body-sm text-ink-faint">
              {text({ ar: "أضف بيانات PayPal في ملف البيئة لتفعيل الدفع الحقيقي.", en: "Add PayPal environment values to enable live payment." })}
            </div>
          )}
        </div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || !items.length}
          className="inline-flex h-12 w-full select-none items-center justify-center gap-2 rounded-sm bg-brand px-6 text-body font-semibold text-white shadow-soft transition-[background-color,transform] duration-instant ease-standard hover:bg-brand-deep hover:-translate-y-px disabled:pointer-events-none disabled:opacity-55"
        >
          <CreditCard size={16} aria-hidden="true" />
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              {text({ ar: "جارٍ فتح Stripe...", en: "Opening Stripe..." })}
            </>
          ) : (
            text({ ar: "الدفع عبر Stripe", en: "Pay with Stripe" })
          )}
        </motion.button>
      )}

      <p className="flex items-center justify-center gap-2 text-center text-caption text-ink-faint">
        <ShieldCheck size={14} className="text-teal-700" aria-hidden="true" />
        {text({ ar: "لا يوجد دفع يدوي أو رفع إثبات دفع. PayPal وStripe فقط.", en: "No manual payment or proof upload. PayPal and Stripe only." })}
      </p>
    </form>
  );
}
