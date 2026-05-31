import { cookies } from "next/headers";
import { Suspense } from "react";
import { PurchasesClient } from "@/components/purchases-client";
import { getPurchaseLibrary } from "@/lib/purchases";
import { PURCHASE_SESSION_COOKIE, verifyPurchaseSession } from "@/lib/purchase-access";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const cookieStore = await cookies();
  const email = verifyPurchaseSession(cookieStore.get(PURCHASE_SESSION_COOKIE)?.value);
  const library = email ? await getPurchaseLibrary(email) : null;

  return (
    <section className="py-12">
      <Suspense fallback={null}>
        <PurchasesClient initialLibrary={library} />
      </Suspense>
    </section>
  );
}
