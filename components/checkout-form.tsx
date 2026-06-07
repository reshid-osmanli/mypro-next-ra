"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, CreditCard, Gift, Loader2, Mail, Phone, ShieldCheck, Ticket, User2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Script from "next/script";
import { useCart } from "./cart-provider";
import { PayPalCheckoutButton } from "./paypal-checkout-button";
import { paypalSdkScriptUrl } from "@/lib/paypal-client";
import { subtotal } from "@/lib/site-math";
import { currencyLabel } from "@/lib/utils";
import { useSitePreferences } from "./site-preferences";

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

export function CheckoutForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { data: session } = useSession();
  const { items, clearCart } = useCart();
  const { text } = useSitePreferences();
  const total = useMemo(() => subtotal(items), [items]);
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
  const [purchaseTrackingConsent, setPurchaseTrackingConsent] = useState(false);
  const signedInEmail = session?.user?.email?.trim() ?? "";

  useEffect(() => {
    if (session?.user?.name && !customerName) setCustomerName(session.user.name);
    if (signedInEmail) setCustomerEmail(signedInEmail);
  }, [customerName, session?.user?.name, signedInEmail]);

  useEffect(() => {
    if (signedInEmail) setPurchaseTrackingConsent(true);
  }, [signedInEmail]);

  const finalTotal = useMemo(() => {
    return Math.max(0, total - (voucherDiscount ?? 0));
  }, [total, voucherDiscount]);

  async function validateVoucher() {
    if (!voucherCode.trim() || !signedInEmail) return;
    setValidatingVoucher(true);
    setVoucherError(null);
    try {
      const response = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode.trim() })
      });
      const data = await response.json();
      if (!response.ok || !data.valid) {
        setVoucherError(data.error || text({ ar: "القسيمة غير صالحة", en: "Invalid voucher" }));
        setVoucherDiscount(null);
      } else {
        setVoucherDiscount(data.voucher.amount);
      }
    } catch (error) {
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
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerName: String(formData.get("customerName") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          notes: String(formData.get("notes") ?? ""),
          purchaseTrackingConsent: formData.get("purchaseTrackingConsent") === "on",
          paymentMethod: "stripe",
          voucherCode: voucherDiscount ? voucherCode.trim() : undefined
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
    <form ref={formRef} onSubmit={handleSubmit} className="panel space-y-6 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-zinc-700">{text({ ar: "الاسم الكامل", en: "Full name" })}</span>
          <div className="relative">
            <User2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input name="customerName" className="input pr-12" placeholder={text({ ar: "اسم العميل", en: "Customer name" })} value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
          </div>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-zinc-700">{text({ ar: "البريد الإلكتروني", en: "Email address" })}</span>
          <div className="relative">
            <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input name="email" type="email" className="input pr-12" placeholder="name@example.com" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} readOnly={Boolean(signedInEmail)} required />
          </div>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-zinc-700">{text({ ar: "رقم الهاتف", en: "Phone number" })}</span>
        <div className="relative">
          <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input name="phone" className="input pr-12" placeholder="+974 ..." />
        </div>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-zinc-700">{text({ ar: "ملاحظات", en: "Notes" })}</span>
        <textarea name="notes" className="textarea" placeholder={text({ ar: "أي تفاصيل إضافية للطلب...", en: "Any extra order details..." })} />
      </label>

      <label className="flex items-start gap-3 rounded-lg border border-qatar-100 bg-white px-4 py-3 text-sm leading-7 text-zinc-700">
        <input
          name="purchaseTrackingConsent"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-qatar-300 text-qatar-700"
          checked={purchaseTrackingConsent}
          onChange={(event) => setPurchaseTrackingConsent(event.target.checked)}
        />
        <span>
          {text({
            ar: "أوافق على حفظ مشترياتي على بريدي الإلكتروني حتى أستطيع عرضها لاحقاً وربطها اختيارياً بحساب Google Drive.",
            en: "I agree to save my purchases under my email so I can view them later and optionally connect Google Drive."
          })}
        </span>
      </label>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-700">{text({ ar: "قسيمة الخصم", en: "Voucher code" })}</p>
        <div className="flex items-start gap-2">
          <div className="relative flex-1">
            <Ticket size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              className="input pr-12"
              placeholder={text({ ar: "أدخل القسيمة هنا", en: "Enter voucher code" })}
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              disabled={!signedInEmail || !!voucherDiscount}
            />
          </div>
          <button
            type="button"
            onClick={validateVoucher}
            disabled={!voucherCode.trim() || !signedInEmail || !!voucherDiscount || validatingVoucher}
            className="btn-secondary disabled:opacity-60"
          >
            {validatingVoucher ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
          </button>
        </div>
        {voucherError ? (
          <p className="text-sm text-rose-600">{voucherError}</p>
        ) : voucherDiscount ? (
          <p className="text-sm text-emerald-700">
            <CheckCircle size={14} className="inline-block mr-1" />
            {text({ ar: "تم تطبيق خصم ", en: "Applied discount " })}
            {currencyLabel(voucherDiscount)}
          </p>
        ) : signedInEmail ? null : (
          <p className="text-sm text-zinc-500">{text({ ar: "سجّل الدخول لاستخدام القسيمة", en: "Sign in to use voucher codes" })}</p>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-700">{text({ ar: "طريقة الدفع", en: "Payment method" })}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => {
                if (provider.enabled) setPaymentMethod(provider.id);
              }}
              disabled={!provider.enabled}
              className={`rounded-lg border p-4 text-right transition ${
                paymentMethod === provider.id
                  ? "border-qatar-400 bg-qatar-50 shadow-[0_18px_40px_rgba(138,21,56,0.08)]"
                  : "border-pearl-200 bg-white hover:border-qatar-200"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span>
                  <span className="block font-semibold text-zinc-950">{text(provider.name)}</span>
                  <span className="mt-1 block text-xs text-zinc-500">{text(provider.hint)}</span>
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${provider.enabled ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                  {provider.enabled ? text({ ar: "مفعّل", en: "Enabled" }) : text({ ar: "غير متصل", en: "Not connected" })}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-qatar-100 bg-qatar-50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-sm text-zinc-600">{voucherDiscount ? text({ ar: "الإجمالي بعد الخصم", en: "Total after discount" }) : text({ ar: "الإجمالي التقريبي", en: "Estimated total" })}</span>
            {voucherDiscount ? (
              <div className="mt-1 space-x-2">
                <span className="text-xs text-zinc-400 line-through">{currencyLabel(total)}</span>
                <span className="text-xs text-emerald-600">{text({ ar: "خصم", en: "Discount" })}: -{currencyLabel(voucherDiscount)}</span>
              </div>
            ) : null}
          </div>
          <span className="text-2xl font-black text-qatar-800">{currencyLabel(finalTotal)}</span>
        </div>
        <p className="mt-2 text-sm leading-7 text-zinc-600">
          {text({
            ar: "يتم إنشاء الطلب محلياً ثم إتمام الدفع عبر PayPal أو Stripe. لن يتم فتح روابط التحميل إلا بعد تحقق الخادم من الدفع.",
            en: "The order is created locally, then completed through PayPal or Stripe. Download links open only after server-side payment verification."
          })}
        </p>
      </div>

      {message ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</div> : null}

      {paymentMethod === "paypal" ? (
        <div className="space-y-3">
          {paypalEnabled ? (
            <PayPalCheckoutButton
              items={items}
              formRef={formRef}
              disabled={!items.length}
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
            <div className="rounded-lg border border-dashed border-qatar-200 bg-white p-5 text-sm text-zinc-500">
              {text({ ar: "أضف بيانات PayPal في ملف البيئة لتفعيل الدفع الحقيقي.", en: "Add PayPal environment values to enable live payment." })}
            </div>
          )}
        </div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || !items.length}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CreditCard size={16} />
          {loading ? text({ ar: "جارٍ فتح Stripe...", en: "Opening Stripe..." }) : text({ ar: "الدفع عبر Stripe", en: "Pay with Stripe" })}
        </motion.button>
      )}

      <p className="flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
        <ShieldCheck size={14} className="text-emerald-700" />
        {text({ ar: "لا يوجد دفع يدوي أو رفع إثبات دفع. PayPal وStripe فقط.", en: "No manual payment or proof upload. PayPal and Stripe only." })}
      </p>
    </form>
  );
}

