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
      <div className="min-h-screen bg-paper px-4 py-10">
        <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col border-l border-line bg-surface px-5 py-6 lg:sticky lg:top-0 lg:h-screen">
          <div className="flex items-center gap-3 rounded-sm border border-line bg-white p-4 shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-ink-deep text-white">
              <BookOpenText size={18} />
            </div>
            <div>
              <p className="font-bold">موقع كُتبي</p>
              <p className="text-xs text-ink-faint">لوحة الإدارة</p>
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
                    active ? "bg-brand-soft text-brand-deep" : "text-ink-soft hover:bg-paper-deep/60"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto hidden rounded-sm border border-line bg-white p-4 shadow-soft lg:block">
            <div className="flex items-center gap-2 text-sm font-bold text-ink-soft">
              <Shield size={16} />
              حماية الإدارة مفعلة
            </div>
            <p className="mt-2 text-xs leading-6 text-ink-faint">
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
