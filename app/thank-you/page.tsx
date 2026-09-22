import { CheckCircle2 } from "lucide-react";
import { cookies } from "next/headers";
import { OrderDownloadGate } from "@/components/order-download-gate";
import { RetryDownloadButton } from "@/components/retry-download-button";
import { LocalizedText } from "@/components/site-preferences";
import { Button } from "@/components/ui/button";
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
    <section className="container-content py-14 md:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="card p-8 text-center md:p-12">
          <span className="mx-auto grid size-16 place-items-center rounded-pill border border-accent-teal/25 bg-accent-teal-soft">
            <CheckCircle2 size={30} className="text-accent-teal" strokeWidth={1.75} aria-hidden="true" />
          </span>

          <h1 className="mt-7 text-h1 font-bold text-ink">
            <LocalizedText value={{ ar: "تم استلام طلبك", en: "Your order has been received" }} />
          </h1>
          <p className="mx-auto mt-4 max-w-md text-body leading-9 text-ink-soft">
            <LocalizedText
              value={
                order
                  ? { ar: "تم الدفع بنجاح. سيتم تنزيل الملفات الآن تلقائيًا من جلسة آمنة لمرة واحدة.", en: "Payment succeeded. Files will download automatically from a one-time secure session." }
                  : expired
                    ? { ar: "انتهت صلاحية رابط التحميل أو تم استخدامه من قبل.", en: "The download link has expired or was already used." }
                    : { ar: "تم إنشاء الطلب بنجاح، وسيظهر المحتوى بعد اكتمال الدفع.", en: "The order was created successfully. Content appears after payment is completed." }
              }
            />
          </p>

          {showError && errorReason && !order ? (
            <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-4 rounded-sm border border-accent-danger/30 bg-accent-danger-soft p-5">
              <p className="text-body-sm font-semibold text-accent-danger">{errorReason}</p>
              <RetryDownloadButton />
            </div>
          ) : null}

          {order && !order.downloadSessionUsedAt ? <div className="text-start"><OrderDownloadGate /></div> : null}

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button href="/products" variant="primary" size="md">
              <LocalizedText value={{ ar: "العودة إلى المنتجات", en: "Back to products" }} />
            </Button>
            <Button href="/" variant="secondary" size="md">
              <LocalizedText value={{ ar: "الصفحة الرئيسية", en: "Home page" }} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
