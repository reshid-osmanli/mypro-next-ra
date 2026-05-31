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
  onCompleted?: (result: { orderId: string }) => void;
  onStatus?: (message: string) => void;
  disabled?: boolean;
};

function buildCheckoutPayload(form: HTMLFormElement, items: CartItem[]) {
  const data = new FormData(form);
  return {
    items,
    customerName: String(data.get("customerName") ?? "").trim(),
    email: String(data.get("email") ?? "").trim(),
    phone: String(data.get("phone") ?? "").trim(),
    notes: String(data.get("notes") ?? "").trim(),
    purchaseTrackingConsent: data.get("purchaseTrackingConsent") === "on"
  };
}

export function PayPalCheckoutButton({ items, formRef, onCompleted, onStatus, disabled }: Props) {
  const { text } = useSitePreferences();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const completedRef = useRef<Props["onCompleted"]>(undefined);
  const statusRef = useRef<Props["onStatus"]>(undefined);
  const [ready, setReady] = useState(false);

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

          const payload = buildCheckoutPayload(form, items);
          if (!payload.customerName || !payload.email) {
            throw new Error(text({ ar: "يرجى إدخال الاسم والبريد الإلكتروني", en: "Please enter your name and email" }));
          }

          statusRef.current?.(text({ ar: "جارٍ إنشاء طلب PayPal...", en: "Creating PayPal order..." }));
          const response = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data?.error || text({ ar: "تعذر إنشاء طلب الدفع", en: "Unable to create payment order" }));
          return data.orderId as string;
        },
        onApprove: async (data: { orderID: string }) => {
          statusRef.current?.(text({ ar: "جارٍ إتمام الدفع...", en: "Completing payment..." }));
          const response = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID })
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result?.error || text({ ar: "تعذر إتمام عملية الدفع", en: "Unable to complete payment" }));
          completedRef.current?.({ orderId: result.orderId as string });
        },
        onCancel: () => {
          statusRef.current?.(text({ ar: "تم إلغاء عملية الدفع", en: "Payment was cancelled" }));
        },
        onError: (error: any) => {
          statusRef.current?.(error?.message || text({ ar: "حدث خطأ في PayPal", en: "A PayPal error occurred" }));
        }
      });

      if (!cancelled) {
        await paypalButtons.render(containerRef.current);
      }
    };

    const timer = window.setInterval(() => {
      if (window.paypal && formRef.current && containerRef.current) {
        setReady(true);
        void render();
        window.clearInterval(timer);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [formRef, items, text]);

  if (disabled) {
    return <div className="rounded-lg border border-dashed border-qatar-200 bg-white p-5 text-sm text-zinc-500">{text({ ar: "أضف عناصر إلى السلة لتفعيل الدفع.", en: "Add items to the cart to enable payment." })}</div>;
  }

  return (
    <div className="space-y-3">
      {!ready ? <div className="rounded-lg border border-qatar-100 bg-white p-5 text-sm text-zinc-500">{text({ ar: "جارٍ تحميل أزرار PayPal...", en: "Loading PayPal buttons..." })}</div> : null}
      <div ref={containerRef} className="min-h-[60px]" />
    </div>
  );
}
