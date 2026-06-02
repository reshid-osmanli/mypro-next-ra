"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { BookOpenText, Home, LayoutDashboard, LogOut, Shield } from "lucide-react";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    await signOut({ redirect: false }).catch(() => null);
    window.location.assign("/admin/login");
  }

  if (isLogin) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f8f5,#ffffff)] px-4 py-10">
        <div className="pointer-events-none fixed inset-0 opacity-50 [background-image:linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f8f5_0%,#ffffff_32%,#ffffff_100%)] text-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col border-l border-zinc-200 bg-white/90 px-5 py-6 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen">
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-950 text-white">
              <BookOpenText size={18} />
            </div>
            <div>
              <p className="font-black">موقع كُتبي</p>
              <p className="text-xs text-zinc-500">لوحة الإدارة</p>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-2">
            {[
              { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
              { href: "/", label: "العودة للموقع", icon: Home }
            ].map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold transition ${
                    active ? "bg-qatar-50 text-qatar-800" : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-sm lg:block">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
              <Shield size={16} />
              حماية الإدارة مفعلة
            </div>
            <p className="mt-2 text-xs leading-6 text-zinc-500">
              دخول خاص، تحقق بالبريد، وحدود محاولات، ومساحة منفصلة للملفات الخاصة.
            </p>
            <button
              type="button"
              onClick={logout}
              className="btn-secondary mt-4 w-full"
            >
              <LogOut size={16} />
              تسجيل الخروج
            </button>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
