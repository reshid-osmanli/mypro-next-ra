"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, BookOpenText, KeyRound, Mail, RefreshCcw, ShieldCheck } from "lucide-react";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"credentials" | "code">("credentials");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [devCode, setDevCode] = useState("");

  const canSubmitCode = useMemo(() => code.trim().length === 8, [code]);

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل الدخول");

      if (data.requiresVerification) {
        setVerifiedEmail(String(data.email || email));
        setMode("code");
        setCode("");
        setDevCode(typeof data.devCode === "string" ? data.devCode : "");
        setError("");
      } else {
        window.location.replace("/admin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !canSubmitCode) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل التحقق");
      window.location.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "تعذر إعادة الإرسال");
      setDevCode(typeof data.devCode === "string" ? data.devCode : "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إعادة الإرسال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel w-full max-w-xl overflow-hidden p-0 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
      <div className="bg-zinc-950 px-8 py-8 text-white">
        <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em]">
          <BookOpenText size={14} />
          منصة كُتبي
        </div>
        <h1 className="mt-5 text-3xl font-black">تسجيل دخول لوحة الإدارة</h1>
        <p className="mt-3 max-w-lg text-sm leading-7 text-white/75">
          مساحة مخصصة لإدارة المنتجات والملفات والصفحات والأسعار، مع تحقق إضافي بالبريد.
        </p>
      </div>

      {mode === "credentials" ? (
        <form onSubmit={submitCredentials} className="space-y-5 p-8">
          <label className="block space-y-2">
            <span className="text-sm font-bold text-zinc-700">البريد الإلكتروني</span>
            <div className="relative">
              <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                className="input pr-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-zinc-700">كلمة المرور</span>
            <div className="relative">
              <ShieldCheck size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                className="input pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                autoComplete="current-password"
                required
              />
            </div>
          </label>

          {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? "جارٍ التحقق..." : "إرسال رمز التحقق"}
            <ArrowLeft size={16} />
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="space-y-5 p-8">
          <div className="rounded-md border border-qatar-100 bg-qatar-50 px-4 py-3 text-sm text-zinc-700">
            تم إرسال رمز تحقق إلى <strong>{verifiedEmail || email}</strong>. أدخل الرمز المكوّن من 8 أرقام.
          </div>

          {devCode ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
              رمز التطوير: {devCode}
            </div>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-bold text-zinc-700">رمز التحقق</span>
            <div className="relative">
              <KeyRound size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                className="input pr-12 text-center text-lg"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="00000000"
                autoComplete="one-time-code"
                required
              />
            </div>
          </label>

          {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <button type="submit" disabled={loading || !canSubmitCode} className="btn-primary w-full disabled:opacity-60">
            {loading ? "جارٍ التحقق..." : "التحقق والدخول"}
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center justify-between gap-3 text-sm">
            <button type="button" onClick={() => setMode("credentials")} className="font-bold text-qatar-700 underline decoration-dotted underline-offset-4">
              الرجوع لتسجيل الدخول
            </button>
            <button type="button" onClick={resendCode} disabled={loading} className="inline-flex items-center gap-2 font-bold text-qatar-700 underline decoration-dotted underline-offset-4 disabled:opacity-50">
              <RefreshCcw size={14} />
              إعادة إرسال الرمز
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
