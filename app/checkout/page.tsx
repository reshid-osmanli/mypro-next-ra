import { PageHero } from "@/components/page-hero";
import { CheckoutForm } from "@/components/checkout-form";
import { LocalizedText } from "@/components/site-preferences";

export default function CheckoutPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <PageHero
        eyebrow={{ ar: "الدفع", en: "Checkout" }}
        title={{ ar: "إتمام الطلب عبر PayPal أو Stripe", en: "Complete the order with PayPal or Stripe" }}
        description={{
          ar: "أدخل بياناتك ثم أكمل الدفع عبر بوابة رسمية. بعد نجاح PayPal أو Stripe سيفتح الموقع روابط التحميل الآمنة فقط.",
          en: "Enter your details and pay through an official gateway. After PayPal or Stripe succeeds, secure download links become available."
        }}
        motion="checkout"
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <CheckoutForm />
        <div className="panel p-6">
          <LocalizedText as="h3" className="text-lg font-bold text-zinc-950" value={{ ar: "كيف يعمل الدفع؟", en: "How payment works" }} />
          <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-600">
            <li>• <LocalizedText value={{ ar: "PayPal ينشئ الطلب ثم يلتقط الدفع من الخادم.", en: "PayPal creates the order and the server captures it." }} /></li>
            <li>• <LocalizedText value={{ ar: "Stripe يستخدم Checkout ثم يتحقق الخادم من الجلسة قبل التحميل.", en: "Stripe uses Checkout and the server verifies the session before download." }} /></li>
            <li>• <LocalizedText value={{ ar: "لا يوجد دفع يدوي أو إثبات دفع قابل للتلاعب.", en: "There is no manual payment or tamperable proof flow." }} /></li>
            <li>• <LocalizedText value={{ ar: "روابط الملفات مؤقتة وتعمل بعد الدفع فقط.", en: "File links are temporary and work only after payment." }} /></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
