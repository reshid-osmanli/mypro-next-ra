import Link from "next/link";
import { Copy, ExternalLink, HandCoins, ShieldCheck, WalletCards } from "lucide-react";
import { auth } from "@/auth";
import { PageHero } from "@/components/page-hero";
import { getOrCreateAffiliateProfile } from "@/lib/affiliates";
import { prisma } from "@/lib/db";
import { resolveSiteUrl } from "@/lib/site-url";
import { currencyLabel, dateLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AffiliatesPage() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  let profile: Awaited<ReturnType<typeof getOrCreateAffiliateProfile>> | null = null;
  let commissions: Array<{ id: string; orderEmail: string; amount: number; rate: number; status: string; createdAt: Date }> = [];

  if (email) {
    profile = await getOrCreateAffiliateProfile(email);
    commissions = await prisma.affiliateCommission.findMany({
      where: { affiliateId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 30
    });
  }

  const siteUrl = resolveSiteUrl() || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const referralLink = profile ? `${siteUrl}/products?ref=${encodeURIComponent(profile.code)}` : "";
  const totalCommission = commissions.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
      <PageHero
        eyebrow={{ ar: "التسويق بالعمولة", en: "Affiliates" }}
        title={{ ar: "سوّق ملفات كُتبي واربح عمولة تلقائية", en: "Promote Kutubi files and earn automatic commission" }}
        description={{
          ar: "شارك رابطك مع المعلمين والزملاء. عند إتمام عملية شراء من رابطك تُضاف العمولة إلى محفظتك داخل الموقع.",
          en: "Share your link with teachers. Paid orders through your link add commission to your site wallet."
        }}
        motion="store"
      />

      {!email ? (
        <div className="mt-10 rounded-lg border border-qatar-100 bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <HandCoins className="mx-auto text-qatar-700" size={36} />
          <h2 className="mt-4 text-2xl font-black text-zinc-950">سجّل الدخول للحصول على رابطك</h2>
          <p className="mt-2 leading-8 text-zinc-600">نحتاج حسابك حتى نربط العمولات بمحفظتك بأمان.</p>
          <Link href="/login" className="btn-primary mt-6">تسجيل الدخول</Link>
        </div>
      ) : profile ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="rounded-lg border border-qatar-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-qatar-700">كودك التسويقي</p>
                  <h2 className="mt-2 text-3xl font-black text-zinc-950">{profile.code}</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                  {profile.commissionRate}% عمولة
                </span>
              </div>
              <div className="mt-5 rounded-lg border border-dashed border-qatar-200 bg-qatar-50 p-4">
                <p className="text-sm font-bold text-zinc-700">رابط المشاركة</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-white px-3 py-2 text-sm text-zinc-800">{referralLink}</code>
                  <Link href={referralLink} className="btn-secondary" target="_blank">
                    <ExternalLink size={16} /> فتح
                  </Link>
                </div>
                <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <Copy size={14} /> انسخ الرابط وشاركه في مجموعات المعلمين أو رسائل واتساب.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-qatar-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <h3 className="text-2xl font-black text-zinc-950">سجل العمولات</h3>
              <div className="mt-5 space-y-3">
                {commissions.map((commission) => (
                  <div key={commission.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-pearl-200 bg-pearl-50 px-4 py-3">
                    <div>
                      <p className="font-bold text-zinc-950">{commission.orderEmail}</p>
                      <p className="text-xs text-zinc-500">{dateLabel(commission.createdAt.toISOString())} · {commission.rate}%</p>
                    </div>
                    <span className="font-black text-qatar-800">{currencyLabel(commission.amount)}</span>
                  </div>
                ))}
                {!commissions.length ? <p className="rounded-lg border border-dashed border-zinc-200 p-5 text-center text-sm text-zinc-500">لا توجد عمولات بعد. ابدأ بمشاركة رابطك.</p> : null}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-qatar-100 bg-qatar-50 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <WalletCards className="text-qatar-700" size={24} />
              <p className="mt-3 text-sm font-bold text-zinc-600">إجمالي عمولاتك</p>
              <p className="mt-1 text-4xl font-black text-qatar-800">{currencyLabel(totalCommission)}</p>
              <p className="mt-3 text-sm leading-7 text-zinc-600">تُضاف العمولة إلى محفظتك ويمكن استخدامها كرصيد عند الدفع.</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white p-5 text-sm leading-7 text-zinc-600">
              <ShieldCheck className="mb-2 text-emerald-700" size={20} />
              لا تُحتسب العمولة على مشترياتك الذاتية، وتُسجل فقط بعد نجاح الدفع عبر Stripe أو PayPal.
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
