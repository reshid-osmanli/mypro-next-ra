import { getLocale } from "next-intl/server";
import { CheckoutForm } from "@/components/checkout-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function CheckoutPage() {
  const locale = (await getLocale()) as "ar" | "en";
  const local = (value: { ar: string; en: string }) => (locale === "en" ? value.en : value.ar);

  return (
    <>
      <PageHeader
        eyebrow={{ ar: "الدفع", en: "Checkout" }}
        title={{ ar: "إتمام الطلب عبر PayPal أو Stripe", en: "Complete the order with PayPal or Stripe" }}
        description={{
          ar: "أدخل بياناتك ثم أكمل الدفع عبر بوابة رسمية. بعد نجاح PayPal أو Stripe تُفتح روابط التحميل الآمنة فقط.",
          en: "Enter your details and pay through an official gateway. After PayPal or Stripe succeeds, secure download links become available."
        }}
        crumbs={[
          { label: { ar: "الرئيسية", en: "Home" }, href: "/" },
          { label: { ar: "السلة", en: "Cart" }, href: "/cart" },
          { label: { ar: "الدفع", en: "Checkout" } }
        ]}
      />
      <div className="container-content grid gap-6 py-10 md:py-12 lg:grid-cols-[1fr_360px]">
        <CheckoutForm />
        <aside className="card h-fit p-6">
          <h3 className="text-h4 font-bold text-ink">
            {local({ ar: "كيف يعمل الدفع؟", en: "How payment works" })}
          </h3>
          <ul className="mt-5 space-y-4 text-body-sm leading-8 text-ink-soft">
            {[
              { ar: "PayPal ينشئ الطلب ثم يلتقط الدفع من الخادم.", en: "PayPal creates the order and the server captures it." },
              { ar: "Stripe يستخدم Checkout ثم يتحقق الخادم من الجلسة قبل التحميل.", en: "Stripe uses Checkout and the server verifies the session before download." },
              { ar: "لا يوجد دفع يدوي أو إثبات دفع قابل للتلاعب.", en: "There is no manual payment or tamperable proof flow." },
              { ar: "روابط الملفات مؤقتة وتعمل بعد الدفع فقط.", en: "File links are temporary and work only after payment." }
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-pill bg-brand" aria-hidden="true" />
                {local(item)}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
