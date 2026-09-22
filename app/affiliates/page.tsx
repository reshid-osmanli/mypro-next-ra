import { Copy, ExternalLink, HandCoins, ShieldCheck, WalletCards } from "lucide-react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { EmptyState } from "@/components/ui/empty-state";
import { getOrCreateAffiliateProfile } from "@/lib/affiliates";
import { prisma } from "@/lib/db";
import { resolveSiteUrl } from "@/lib/site-url";
import { currencyLabel, dateLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AffiliatesPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  const local = (value: { ar: string; en: string }) => (locale === "en" ? value.en : value.ar);
  const email = session?.user?.email?.trim().toLowerCase();

  let profile: Awaited<ReturnType<typeof getOrCreateAffiliateProfile>> | null = null;
  let commissions: Array<{ id: string; orderEmail: string; amount: number; rate: number; status: string; createdAt: Date }> = [];

  if (email) {
    try {
      profile = await getOrCreateAffiliateProfile(email);
    } catch (error) {
      console.warn("[affiliates] Unable to create or load profile", error);
    }
    if (profile) {
      try {
        commissions = await prisma.affiliateCommission.findMany({
          where: { affiliateId: profile.id },
          orderBy: { createdAt: "desc" },
          take: 30
        });
      } catch (error) {
        console.warn("[affiliates] Unable to load commissions", error);
      }
    }
  }

  const siteUrl = resolveSiteUrl() || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const referralLink = profile ? `${siteUrl}/products?ref=${encodeURIComponent(profile.code)}` : "";
  const totalCommission = commissions.reduce((sum, item) => sum + item.amount, 0);

  return (
    <>
      <PageHeader
        eyebrow={{ ar: "التسويق بالعمولة", en: "Affiliates" }}
        title={{ ar: "سوّق ملفات كُتبي واربح عمولة تلقائية", en: "Promote Kutubi files and earn automatic commission" }}
        description={{
          ar: "شارك رابطك مع المعلمين والزملاء. عند إتمام عملية شراء من رابطك تُضاف العمولة إلى محفظتك داخل الموقع.",
          en: "Share your link with teachers. Paid orders through your link add commission to your site wallet."
        }}
        crumbs={[
          { label: local({ ar: "الرئيسية", en: "Home" }), href: "/" },
          { label: local({ ar: "العمولة", en: "Affiliates" }) }
        ]}
      />

      <div className="container-content py-10 md:py-12">
        {!email ? (
          <div className="mx-auto max-w-2xl">
            <EmptyState
              icon={HandCoins}
              title={local({ ar: "سجّل الدخول للحصول على رابطك", en: "Sign in to get your link" })}
              description={local({
                ar: "نحتاج حسابك حتى نربط العمولات بمحفظتك بأمان.",
                en: "We need your account to link commissions to your wallet securely."
              })}
              action={
                <Button href="/login" variant="primary" size="md">
                  {local({ ar: "تسجيل الدخول", en: "Sign in" })}
                </Button>
              }
            />
          </div>
        ) : profile ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              {/* referral code */}
              <div className="card p-6 md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-label font-bold text-brand-deep">{local({ ar: "كودك التسويقي", en: "Your referral code" })}</p>
                    <h2 className="mt-2 text-h1 font-bold tracking-wide text-ink" dir="ltr">{profile.code}</h2>
                  </div>
                  <span className="tnum inline-flex h-9 items-center gap-1.5 rounded-pill border border-accent-gold/25 bg-accent-gold-soft px-4 text-body-sm font-bold text-accent-gold">
                    {profile.commissionRate}%
                    {local({ ar: "عمولة", en: "commission" })}
                  </span>
                </div>
                <div className="mt-6 rounded-sm border border-dashed border-brand/30 bg-brand-soft/30 p-4">
                  <p className="text-body-sm font-semibold text-ink">{local({ ar: "رابط المشاركة", en: "Share link" })}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <code className="min-w-0 flex-1 overflow-x-auto rounded-sm border border-line bg-surface px-3.5 py-2.5 text-body-sm text-ink" dir="ltr">{referralLink}</code>
                    <Button href={referralLink} variant="secondary" size="sm" className="h-10" target="_blank">
                      <ExternalLink size={14} aria-hidden="true" />
                      {local({ ar: "فتح", en: "Open" })}
                    </Button>
                  </div>
                  <p className="mt-3 inline-flex items-center gap-2 text-caption text-ink-faint">
                    <Copy size={13} aria-hidden="true" />
                    {local({ ar: "انسخ الرابط وشاركه في مجموعات المعلمين أو رسائل واتساب.", en: "Copy the link and share it in teacher groups or WhatsApp." })}
                  </p>
                </div>
              </div>

              {/* commission log */}
              <div className="card p-6 md:p-7">
                <h3 className="text-h3 font-bold text-ink">{local({ ar: "سجل العمولات", en: "Commission log" })}</h3>
                <div className="mt-5 space-y-2.5">
                  {commissions.map((commission) => (
                    <div key={commission.id} className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line bg-surface px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-body-sm font-bold text-ink">{commission.orderEmail}</p>
                        <p className="mt-0.5 text-caption text-ink-faint">
                          {dateLabel(commission.createdAt.toISOString())} · <span className="tnum" dir="ltr">{commission.rate}%</span>
                        </p>
                      </div>
                      <span className="tnum text-body-sm font-bold text-brand-deep" dir="ltr">{currencyLabel(commission.amount)}</span>
                    </div>
                  ))}
                  {!commissions.length ? (
                    <p className="rounded-sm border border-dashed border-line-strong p-6 text-center text-body-sm text-ink-faint">
                      {local({ ar: "لا توجد عمولات بعد. ابدأ بمشاركة رابطك.", en: "No commissions yet. Start by sharing your link." })}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="card p-6">
                <span className="grid size-11 place-items-center rounded-sm border border-line bg-surface text-brand">
                  <WalletCards size={20} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <p className="mt-4 text-caption text-ink-faint">{local({ ar: "إجمالي عمولاتك", en: "Your total commissions" })}</p>
                <div className="mt-1.5">
                  <Price value={totalCommission} size="xl" />
                </div>
                <p className="mt-4 text-body-sm leading-8 text-ink-soft">
                  {local({ ar: "تُضاف العمولة إلى محفظتك ويمكن استخدامها كرصيد عند الدفع.", en: "Commissions are added to your wallet and can be used as balance at checkout." })}
                </p>
              </div>
              <div className="rounded-sm border border-line bg-paper-deep/40 p-5 text-body-sm leading-8 text-ink-soft">
                <span className="mb-2 flex items-center gap-2 text-body-sm font-bold text-ink">
                  <ShieldCheck size={16} className="text-teal-700" aria-hidden="true" />
                  {local({ ar: "ضوابط واضحة", en: "Clear rules" })}
                </span>
                {local({
                  ar: "لا تُحتسب العمولة على مشترياتك الذاتية، وتُسجل فقط بعد نجاح الدفع عبر Stripe أو PayPal.",
                  en: "Commission is not counted on your own purchases, and is recorded only after a successful Stripe or PayPal payment."
                })}
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </>
  );
}
