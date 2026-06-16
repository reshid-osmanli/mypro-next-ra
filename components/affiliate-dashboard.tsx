// ============================================================================
// components/affiliate-dashboard.tsx — Affiliate earnings dashboard
// ----------------------------------------------------------------------------
// New file: /components/affiliate-dashboard.tsx
// Used on /affiliates page
// ============================================================================

import { Copy, Wallet, Users2, TrendingUp, Share2 } from "lucide-react";
import { currencyLabel, dateLabel } from "@/lib/utils";

type Commission = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  orderEmail: string;
};

type Props = {
  email: string;
  code: string;
  commissionRate: number;
  active: boolean;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  commissions: Commission[];
  referralCount: number;
  referralLink: string;
};

export function AffiliateDashboard(props: Props) {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-pearl-200 bg-gradient-to-br from-qatar-50 to-pearl-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-qatar-800">لوحة التسويق بالعمولة</p>
            <h1 className="mt-1 text-2xl font-black text-zinc-950">{props.email}</h1>
            <p className="mt-1 text-sm text-zinc-600">
              نسبة العمولة الحالية: <strong>{props.commissionRate}%</strong>
              {props.active ? (
                <span className="ms-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700">فعّال</span>
              ) : (
                <span className="ms-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-black text-rose-700">معطّل</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-pearl-200 bg-white px-4 py-3">
            <Share2 size={18} className="text-qatar-700" />
            <code className="font-mono text-sm font-bold text-zinc-700">{props.code}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(props.referralLink)}
              className="rounded-md bg-qatar-700 px-2 py-1 text-xs font-bold text-white hover:bg-qatar-800"
            >
              <Copy size={12} className="inline" /> نسخ
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={<Wallet size={20} className="text-emerald-700" />} label="إجمالي الأرباح" value={currencyLabel(props.totalEarnings)} />
        <StatCard icon={<TrendingUp size={20} className="text-amber-700" />} label="قيد التسوية" value={currencyLabel(props.pendingEarnings)} />
        <StatCard icon={<Wallet size={20} className="text-qatar-700" />} label="المدفوع" value={currencyLabel(props.paidEarnings)} />
        <StatCard icon={<Users2 size={20} className="text-sky-700" />} label="عدد الإحالات" value={String(props.referralCount)} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-pearl-200 bg-white">
        <header className="border-b border-pearl-200 px-5 py-3 text-sm font-black text-zinc-950">آخر العمولات</header>
        <table className="w-full text-sm">
          <thead className="bg-pearl-50 text-xs text-zinc-600">
            <tr>
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">المشتري</th>
              <th className="px-4 py-3 text-right">المبلغ</th>
              <th className="px-4 py-3 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {props.commissions.map((c) => (
              <tr key={c.id} className="border-t border-pearl-100">
                <td className="px-4 py-3 text-zinc-600">{dateLabel(c.createdAt)}</td>
                <td className="px-4 py-3 text-zinc-700">{c.orderEmail}</td>
                <td className="px-4 py-3 font-bold text-qatar-800">{currencyLabel(c.amount)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-black ${
                    c.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                    c.status === "credited" ? "bg-amber-100 text-amber-700" :
                    "bg-zinc-100 text-zinc-700"
                  }`}>{c.status}</span>
                </td>
              </tr>
            ))}
            {!props.commissions.length && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-zinc-500">
                  لا توجد عمولات بعد. شارك رابطك مع المعلمين لتبدأ في الكسب!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-pearl-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-black text-zinc-950">{value}</div>
    </div>
  );
}
