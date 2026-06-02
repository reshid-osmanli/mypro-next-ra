import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await requireAdminSession()) {
    redirect("/admin");
  }

  return <AdminLoginForm />;
}
