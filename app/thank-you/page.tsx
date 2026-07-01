import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cookies } from "next/headers";
import { OrderDownloadGate } from "@/components/order-download-gate";
import { RetryDownloadButton } from "@/components/retry-download-button";
import { ConfettiCelebration } from "@/components/confetti-celebration";
import { LocalizedText } from "@/components/site-preferences";
import { MotionShowcase } from "@/components/motion-showcase";
import { DOWNLOAD_SESSION_COOKIE, hashToken } from "@/lib/order-access";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type ThankYouSearchParams = { order?: string; expired?: string; error?: string };

export default async function ThankYouPage({ searchParams }: { searchParams?: Promise<ThankYouSearchParams> }) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(DOWNLOAD_SESSION_COOKIE)?.value;
  const sessionHash = sessionToken ? hashToken(sessionToken) : null;

  let order = null;

  if (sessionHash) {
    try {
      order = await prisma.order.findFirst({
        where: {
          downloadSessionHash: sessionHash,
          downloadSessionExpiresAt: { gt: new Date() },
          downloadSessionUsedAt: null,
          status: "paid"
        },
        include: {
          items: {
            include: {
              product: {
                include: { files: true }
              }
            }
          }
        }
      });
    } catch (error) {
      console.warn("[thank-you] Unable to load order", error);
    }
  }

  const showError = Boolean(params.error);
  const errorReason = params.error ? decodeURIComponent(params.error) : null;
  const expired = Boolean(params.expired) || Boolean(order?.downloadSessionUsedAt);

  return (
    <>
      <ConfettiCelebration fire={Boolean(order)} />
    <section className="mx-auto max-w-3xl px-4 py-20 text-center lg:px-8">
      <div className="panel p-10">
        <CheckCircle2 size={56} className="mx-auto text-emerald-600" />
        <LocalizedText as="h1" className="mt-6 text-3xl font-black text-zinc-950" value={{ ar: "تم استلام طلبك", en: "Your order has been received" }} />
        <p className="mt-4 text-base leading-8 text-zinc-600">
          <LocalizedText
            value={order
              ? { ar: "تم الدفع بنجاح. سيتم تنزيل الملفات الآن تلقائياً من جلسة آمنة لمرة واحدة.", en: "Payment succeeded. Files will download automatically from a one-time secure session." }
              : expired
                ? { ar: "انتهت صلاحية رابط التحميل أو تم استخدامه من قبل.", en: "The download link has expired or was already used." }
                : { ar: "تم إنشاء الطلب بنجاح، وسيظهر المحتوى بعد اكتمال الدفع.", en: "The order was created successfully. Content appears after payment is completed." }}
          />
        </p>

        {showError && errorReason && !order ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            <p className="mb-3">{errorReason}</p>
            <RetryDownloadButton />
          </div>
        ) : null}

        <MotionShowcase variant="download" compact className="mt-8 text-right" />

        {order && !order.downloadSessionUsedAt ? <OrderDownloadGate /> : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/products" className="btn-primary"><LocalizedText value={{ ar: "العودة إلى المنتجات", en: "Back to products" }} /></Link>
          <Link href="/" className="btn-secondary"><LocalizedText value={{ ar: "الصفحة الرئيسية", en: "Home page" }} /></Link>
        </div>
      </div>
    </section>
    </>
  );
}
