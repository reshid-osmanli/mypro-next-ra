import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { Database, LogIn } from "lucide-react";
import { auth } from "@/auth";
import { PurchasesClient } from "@/components/purchases-client";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { getPurchaseLibrary } from "@/lib/purchases";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  const local = (value: { ar: string; en: string }) => (locale === "en" ? value.en : value.ar);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return (
      <>
        <PageHeader
          eyebrow={local({ ar: "حسابي", en: "My account" })}
          title={local({ ar: "مشترياتي", en: "My purchases" })}
          crumbs={[
            { label: local({ ar: "الرئيسية", en: "Home" }), href: "/" },
            { label: local({ ar: "مشترياتي", en: "Purchases" }) }
          ]}
        />
        <div className="container-content py-12">
          <EmptyState
            icon={LogIn}
            title={local({ ar: "سجل الدخول لعرض مشترياتك", en: "Sign in to view your purchases" })}
            description={local({
              ar: "مشترياتك مرتبطة ببريد حساب Google الذي سجلت الدخول به.",
              en: "Your purchases are tied to the Google email you sign in with."
            })}
            action={
              <Button href="/login?callbackUrl=/purchases" variant="primary" size="md">
                {local({ ar: "تسجيل الدخول", en: "Sign in" })}
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const library = await getPurchaseLibrary(email);

  if (!library) {
    return (
      <>
        <PageHeader
          eyebrow={local({ ar: "حسابي", en: "My account" })}
          title={local({ ar: "مشترياتي", en: "My purchases" })}
          crumbs={[
            { label: local({ ar: "الرئيسية", en: "Home" }), href: "/" },
            { label: local({ ar: "مشترياتي", en: "Purchases" }) }
          ]}
        />
        <div className="container-content py-12">
          <EmptyState
            icon={Database}
            title={local({ ar: "لا يمكن عرض مشترياتك حالياً", en: "Purchases can't be loaded right now" })}
            description={local({
              ar: "حدث خطأ أثناء الاتصال بقاعدة البيانات. أعد تحميل الصفحة بعد قليل.",
              en: "A database connection error occurred. Reload the page in a moment."
            })}
            action={
              <Button href="/purchases" variant="secondary" size="md">
                {local({ ar: "إعادة المحاولة", en: "Try again" })}
              </Button>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={local({ ar: "حسابي", en: "My account" })}
        title={local({ ar: "مشترياتي", en: "My purchases" })}
        crumbs={[
          { label: local({ ar: "الرئيسية", en: "Home" }), href: "/" },
          { label: local({ ar: "مشترياتي", en: "Purchases" }) }
        ]}
      />
      <div className="container-content py-10 md:py-12">
        <Suspense fallback={null}>
          <PurchasesClient initialLibrary={library} />
        </Suspense>
      </div>
    </>
  );
}
