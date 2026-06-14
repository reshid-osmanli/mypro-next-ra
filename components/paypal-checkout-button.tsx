"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import type { CartItem } from "@/lib/types";
import { useSitePreferences } from "./site-preferences";

declare global {
  interface Window {
    paypal?: any;
  }
}

type Props = {
  items: CartItem[];
  formRef: RefObject<HTMLFormElement | null>;
  onCompleted?: (result: { orderId: string; claimToken?: string | null }) => void;
  onStatus?: (message: string) => void;
  disabled?: boolean;
  voucherCode?: string;
};

function buildCheckoutPayload(form: HTMLFormElement, items: CartItem[], voucherCode?: string) {
  const data = new FormData(form);
  return {
    items,
    customerName: String(data.get("customerName") ?? "").trim(),
    email: String(data.get("email") ?? "").trim(),
    phone: String(data.get("phone") ?? "").trim(),
    notes: String(data.get("notes") ?? "").trim(),
    purchaseTrackingConsent: data.get("purchaseTrackingConsent") === "on",
    voucherCode: voucherCode?.trim() || undefined
  };
}

export function PayPalCheckoutButton({ items, formRef, onCompleted, onStatus, disabled, voucherCode }: Props) {
  const { text } = useSitePreferences();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const completedRef = useRef<Props["onCompleted"]>(undefined);
  const statusRef = useRef<Props["onStatus"]>(undefined);
  const localOrderIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    completedRef.current = onCompleted;
    statusRef.current = onStatus;
  }, [onCompleted, onStatus]);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!containerRef.current || !window.paypal || !formRef.current) return;
      if (containerRef.current.childElementCount > 0) {
        containerRef.current.innerHTML = "";
      }

      const paypalButtons = window.paypal.Buttons({
        style: {
          layout: "vertical",
          label: "pay",
          shape: "pill",
          tagline: false
        },
        createOrder: async () => {
          const form = formRef.current;
          if (!form) {
            throw new Error(text({ ar: "النموذج غير جاهز", en: "The form is not ready" }));
          }
          if (!form.reportValidity()) {
            throw new Error(text({ ar: "يرجى إكمال بيانات الشراء أولًا", en: "Please complete the purchase details first" }));
          }

          const payload = buildCheckoutPayload(form, items, voucherCode);
          if (!payload.customerName || !payload.email) {
            throw new Error(text({ ar: "يرجى إدخال الاسم والبريد الإلكتروني", en: "Please enter your name and email" }));
          }

          statusRef.current?.(text({ ar: "جارٍ إنشاء طلب PayPal...", en: "Creating PayPal order..." }));
          const response = await fetch("/api/paypal/create-order", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data?.error || text({ ar: "تعذر إنشاء طلب الدفع", en: "Unable to create payment order" }));
          localOrderIdRef.current = typeof data?.localOrderId === "string" ? data.localOrderId : null;
          return data.orderId as string;
        },
        onApprove: async (data: { orderID: string }) => {
          statusRef.current?.(text({ ar: "جارٍ إتمام الدفع...", en: "Completing payment..." }));
          const response = await fetch("/api/paypal/capture-order", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID })
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result?.error || text({ ar: "تعذر إتمام عملية الدفع", en: "Unable to complete payment" }));
          localOrderIdRef.current = null;
          completedRef.current?.({
            orderId: result.orderId as string,
            claimToken: typeof result.claimToken === "string" ? result.claimToken : null
          });
        },
        onCancel: () => {
          const localOrderId = localOrderIdRef.current;
          localOrderIdRef.current = null;
          if (localOrderId) {
            void fetch(`/api/order/cancel?order=${encodeURIComponent(localOrderId)}`, { credentials: "include" });
          }
          statusRef.current?.(text({ ar: "تم إلغاء عملية الدفع", en: "Payment was cancelled" }));
        },
        onError: (error: any) => {
          const localOrderId = localOrderIdRef.current;
          localOrderIdRef.current = null;
          if (localOrderId) {
            void fetch(`/api/order/cancel?order=${encodeURIComponent(localOrderId)}`, { credentials: "include" });
          }
          statusRef.current?.(error?.message || text({ ar: "حدث خطأ في PayPal", en: "A PayPal error occurred" }));
        }
      });

      if (!cancelled) {
        await paypalButtons.render(containerRef.current);
      }
    };

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (window.paypal && formRef.current && containerRef.current) {
        setLoadError("");
        setReady(true);
        void render();
        window.clearInterval(timer);
        return;
      }

      if (Date.now() - startedAt > 15000) {
        window.clearInterval(timer);
        if (!cancelled) {
          setLoadError(
            text({
              ar: "تعذر تحميل PayPal. تحقق من NEXT_PUBLIC_PAYPAL_CLIENT_ID و PAYPAL_ENV على Vercel، ثم أعد النشر.",
              en: "Unable to load PayPal. Check NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_ENV on Vercel, then redeploy."
            })
          );
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [formRef, items, text, voucherCode]);

  if (disabled) {
    return <div className="rounded-lg border border-dashed border-qatar-200 bg-white p-5 text-sm text-zinc-500">{text({ ar: "أضف عناصر إلى السلة لتفعيل الدفع.", en: "Add items to the cart to enable payment." })}</div>;
  }

  return (
    <div className="space-y-3">
      {loadError ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{loadError}</div> : null}
      {!ready && !loadError ? <div className="rounded-lg border border-qatar-100 bg-white p-5 text-sm text-zinc-500">{text({ ar: "جارٍ تحميل أزرار PayPal...", en: "Loading PayPal buttons..." })}</div> : null}
      <div ref={containerRef} className="min-h-[60px]" />
    </div>
  );
}
