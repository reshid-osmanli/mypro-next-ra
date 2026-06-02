"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProviders, signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

type AuthCardProps = {
  mode: "login" | "signup";
};

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleReady, setGoogleReady] = useState<boolean | null>(null);
  const callbackUrl = useMemo(() => {
    const value = searchParams.get("callbackUrl");
    return value?.startsWith("/") && !value.startsWith("//") ? value : "/purchases";
  }, [searchParams]);
  const isSignup = mode === "signup";

  useEffect(() => {
    if (status === "authenticated") router.replace(callbackUrl);
  }, [callbackUrl, router, status]);

  useEffect(() => {
    let active = true;
    getProviders()
      .then((providers) => {
        if (!active) return;
        const hasGoogle = Boolean(providers?.google);
        setGoogleReady(hasGoogle);
        if (!hasGoogle) {
          setError("تسجيل الدخول عبر Google غير مهيأ بعد. أضف AUTH_GOOGLE_ID و AUTH_GOOGLE_SECRET ثم أعد تشغيل الخادم.");
        }
      })
      .catch(() => {
        if (!active) return;
        setGoogleReady(false);
        setError("تعذر قراءة إعدادات تسجيل الدخول. حاول مرة أخرى بعد إعادة تشغيل الخادم.");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (errorCode) setError("تعذر إكمال تسجيل الدخول. حاول مرة أخرى.");
  }, [searchParams]);

  async function continueWithGoogle() {
    if (!googleReady) {
      setError("تسجيل الدخول عبر Google غير مهيأ بعد. أضف AUTH_GOOGLE_ID و AUTH_GOOGLE_SECRET ثم أعد تشغيل الخادم.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError("تعذر بدء تسجيل الدخول عبر Google.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-7xl items-center justify-center px-4 py-12 lg:px-8">
      <div className="panel w-full max-w-xl overflow-hidden p-0 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <div className="bg-zinc-950 px-8 py-8 text-white">
          <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em]">
            <ShieldCheck size={14} />
            حساب كُتبي
          </div>
          <h1 className="mt-5 text-3xl font-black">{isSignup ? "إنشاء حساب" : "تسجيل الدخول"}</h1>
          <p className="mt-3 max-w-lg text-sm leading-7 text-white/75">
            {isSignup
              ? "أنشئ حسابك عبر Google حتى ترتبط مكتبتك ومشترياتك ببريدك نفسه."
              : "ادخل بحساب Google لعرض المكتبة وتتبع المشتريات والملفات المرتبطة ببريدك."}
          </p>
        </div>

        <div className="space-y-5 p-8">
          {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <button type="button" onClick={continueWithGoogle} disabled={loading || status === "loading" || googleReady === null} className="btn-primary w-full disabled:opacity-60">
            {loading || status === "loading" || googleReady === null ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {isSignup ? "المتابعة وإنشاء الحساب عبر Google" : "المتابعة عبر Google"}
            <ArrowLeft size={16} />
          </button>

          <div className="rounded-lg border border-qatar-100 bg-qatar-50 px-4 py-3 text-sm leading-7 text-qatar-900">
            سيتم استخدام بريد Google المسجل للدخول لعرض مشترياتك وربط Google Drive عند اختيارك ذلك.
          </div>

          <div className="text-center text-sm text-zinc-600">
            {isSignup ? "لديك حساب؟ " : "ليس لديك حساب؟ "}
            <Link href={isSignup ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-black text-qatar-700 underline decoration-dotted underline-offset-4">
              {isSignup ? "تسجيل الدخول" : "إنشاء حساب"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
