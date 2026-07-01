import { Suspense } from "react";
import { EmptyOrders } from "@/components/empty-states";
import { auth } from "@/auth";
import { PurchasesClient } from "@/components/purchases-client";
import { getPurchaseLibrary } from "@/lib/purchases";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return (
      <section className="py-12">
        <EmptyOrders />
      </section>
    );
  }

  const library = await getPurchaseLibrary(email);

  if (!library) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-xl">
          <div className="panel space-y-5 p-6 text-right">
            <div className="inline-flex items-center gap-2 rounded-full bg-qatar-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-qatar-800">
              تعذر تحميل المشتريات
            </div>
            <h1 className="text-3xl font-black text-zinc-950">لا يمكن عرض مشترياتك حالياً</h1>
            <p className="leading-8 text-zinc-600">
              حدث خطأ أثناء الاتصال بقاعدة البيانات. تأكد من عمل الاتصال ثم أعد تحميل الصفحة.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <Suspense fallback={null}>
        <PurchasesClient initialLibrary={library} />
      </Suspense>
    </section>
  );
}
