import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { PurchasesClient } from "@/components/purchases-client";
import { getPurchaseLibrary } from "@/lib/purchases";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    redirect("/login?callbackUrl=/purchases");
  }

  const library = await getPurchaseLibrary(email);

  return (
    <section className="py-12">
      <Suspense fallback={null}>
        <PurchasesClient initialLibrary={library} />
      </Suspense>
    </section>
  );
}
