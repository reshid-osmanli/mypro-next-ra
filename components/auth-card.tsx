"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProviders, signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

type AuthCardProps = {
  mode: "login" | "signup";
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.24 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.37c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.37 12 5.37z" />
    </svg>
  );
}

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

          <button type="button" onClick={continueWithGoogle} disabled={loading || status === "loading" || googleReady === null} className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm font-black text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:border-qatar-200 hover:shadow-lg disabled:opacity-60">
            {loading || status === "loading" || googleReady === null ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
            {isSignup ? "إنشاء الحساب عبر Google" : "تسجيل الدخول عبر Google"}
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
