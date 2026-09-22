"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProviders, signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { useSitePreferences } from "@/components/site-preferences";
import { ArrowForward } from "@/components/ui/icon";

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
  const { text } = useSitePreferences();
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
          setError(
            text({
              ar: "تسجيل الدخول عبر Google غير مهيأ بعد. أضف AUTH_GOOGLE_ID و AUTH_GOOGLE_SECRET ثم أعد تشغيل الخادم.",
              en: "Google sign-in is not configured yet. Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET, then restart the server."
            })
          );
        }
      })
      .catch(() => {
        if (!active) return;
        setGoogleReady(false);
        setError(
          text({ ar: "تعذر قراءة إعدادات تسجيل الدخول. حاول مرة أخرى بعد إعادة تشغيل الخادم.", en: "Unable to read sign-in settings. Try again after restarting the server." })
        );
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (errorCode) setError(text({ ar: "تعذر إكمال تسجيل الدخول. حاول مرة أخرى.", en: "Unable to complete sign-in. Try again." }));
  }, [searchParams, text]);

  async function continueWithGoogle() {
    if (!googleReady) {
      setError(
        text({
          ar: "تسجيل الدخول عبر Google غير مهيأ بعد. أضف AUTH_GOOGLE_ID و AUTH_GOOGLE_SECRET ثم أعد تشغيل الخادم.",
          en: "Google sign-in is not configured yet. Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET, then restart the server."
        })
      );
      return;
    }

    setLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError(text({ ar: "تعذر بدء تسجيل الدخول عبر Google.", en: "Unable to start Google sign-in." }));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-7xl items-center justify-center px-4 py-12 lg:px-8">
      <div className="card w-full max-w-xl overflow-hidden">
        {/* header band */}
        <div className="border-b border-line bg-ink-deep px-7 py-7 text-paper md:px-8">
          <span className="inline-flex h-8 items-center gap-2 rounded-pill border border-white/15 bg-white/10 px-3 text-caption font-semibold text-paper/90">
            <ShieldCheck size={13} aria-hidden="true" />
            {text({ ar: "حساب كُتبي", en: "Kutubi account" })}
          </span>
          <h1 className="mt-4 text-h1 font-bold text-paper">{isSignup ? text({ ar: "إنشاء حساب", en: "Create account" }) : text({ ar: "تسجيل الدخول", en: "Sign in" })}</h1>
          <p className="mt-3 max-w-lg text-body-sm leading-8 text-paper/70">
            {isSignup
              ? text({ ar: "أنشئ حسابك عبر Google حتى ترتبط مكتبتك ومشترياتك ببريدك نفسه.", en: "Create your account with Google so your library and purchases are tied to your email." })
              : text({ ar: "ادخل بحساب Google لعرض المكتبة وتتبع المشتريات والملفات المرتبطة ببريدك.", en: "Sign in with Google to view your library and track purchases tied to your email." })}
          </p>
        </div>

        <div className="space-y-5 p-7 md:p-8">
          {error ? (
            <div className="rounded-sm border border-accent-danger/30 bg-accent-danger-soft px-4 py-3 text-body-sm font-semibold text-accent-danger">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={continueWithGoogle}
            disabled={loading || status === "loading" || googleReady === null}
            className="inline-flex w-full items-center justify-center gap-3 rounded-sm border border-line bg-surface px-5 py-4 text-body font-semibold text-ink transition-colors duration-instant hover:border-line-strong hover:bg-paper-deep/50 disabled:opacity-55"
          >
            {loading || status === "loading" || googleReady === null ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <GoogleIcon />
            )}
            {isSignup ? text({ ar: "إنشاء الحساب عبر Google", en: "Create account with Google" }) : text({ ar: "تسجيل الدخول عبر Google", en: "Sign in with Google" })}
            <ArrowForward size={15} aria-hidden="true" />
          </button>

          <div className="rounded-sm border border-brand/15 bg-brand-soft/40 px-4 py-3 text-body-sm leading-8 text-ink-soft">
            {text({
              ar: "سيتم استخدام بريد Google المسجل للدخول لعرض مشترياتك وربط Google Drive عند اختيارك ذلك.",
              en: "Your registered Google email is used to view your purchases and, if you choose, connect Google Drive."
            })}
          </div>

          <div className="text-center text-body-sm text-ink-soft">
            {isSignup ? text({ ar: "لديك حساب؟ ", en: "Already have an account? " }) : text({ ar: "ليس لديك حساب؟ ", en: "Don't have an account? " })}
            <Link
              href={isSignup ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-semibold text-brand-deep underline decoration-dotted underline-offset-4 transition-colors duration-instant hover:text-brand"
            >
              {isSignup ? text({ ar: "تسجيل الدخول", en: "Sign in" }) : text({ ar: "إنشاء حساب", en: "Create account" })}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
